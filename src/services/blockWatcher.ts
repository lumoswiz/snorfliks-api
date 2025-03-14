import { foundry, sonic, sonicBlazeTestnet } from 'viem/chains';
import { getClient } from '../contracts/clients';
import { ContractReader } from '../utils/contractReader';
import {
  stateCache,
  updateTokensCache,
  updatePrizePoolCache,
  updateLastProcessedBlock,
  updateGameStateCache,
} from '../utils/stateCache';

// Chain name to ID mapping
const CHAIN_MAPPING = {
  sonic: sonic.id,
  blaze: sonicBlazeTestnet.id,
  foundry: foundry.id,
};

// Get the chain from environment variable
const CHAIN_ENV = process.env.CHAIN_ENV || 'foundry';

// Get the chain ID from the mapping
const DEFAULT_CHAIN_ID =
  CHAIN_MAPPING[CHAIN_ENV as keyof typeof CHAIN_MAPPING] || foundry.id;

// Near the top of the file, with other constants
const POLLING_INTERVAL = Number(process.env.BLOCK_POLLING_INTERVAL) || 1000; // Default 1s, configurable via env

/**
 * Updates data for the specified chain
 */
async function updateChainData(
  chainId: number,
  blockNumber: bigint,
  blockTimestamp: number
): Promise<void> {
  try {
    // Skip already processed blocks
    if (
      stateCache.lastBlockProcessed[chainId] &&
      blockNumber <= stateCache.lastBlockProcessed[chainId]
    ) {
      return;
    }

    const reader = new ContractReader(chainId);

    // Fetch token data
    const tokenData = await reader.getTokenInfos();
    updateTokensCache(chainId, tokenData);

    // Fetch prize pool data
    const prizePool = await reader.getPrizePool();
    updatePrizePoolCache(chainId, prizePool);

    // Smartly determine if we need to check game state
    const now = blockTimestamp;
    let shouldUpdateGameState = false;

    // If no game state exists, always update
    if (!stateCache.gameState[chainId]) {
      shouldUpdateGameState = true;
    } else {
      const currentGameState = stateCache.gameState[chainId];

      // Check if we're close to any transition time
      const nextTransition = currentGameState.nextTransition || 0;
      const closeToTransition = Math.abs(nextTransition - now) < 300; // Within 5 mins

      // We're past cooldown expiry, check more frequently (possible phase changes)
      const pastCooldown = now >= currentGameState.cooldownExpiry;

      // Determine update frequency
      const lastUpdate = stateCache.lastUpdateTime?.[chainId] || 0;
      const timeSinceUpdate = now - lastUpdate;

      // Update frequently near transitions, less frequently otherwise
      if (closeToTransition || pastCooldown) {
        shouldUpdateGameState = timeSinceUpdate > 5000; // Every 5 seconds near transitions
      } else {
        shouldUpdateGameState = timeSinceUpdate > 30000; // Every 30 seconds normally
      }
    }

    if (shouldUpdateGameState) {
      const gameState = await reader.getGameState();
      updateGameStateCache(chainId, gameState);

      // Update last check time
      if (!stateCache.lastUpdateTime) stateCache.lastUpdateTime = {};
      stateCache.lastUpdateTime[chainId] = now;
    }

    // Track last processed block
    updateLastProcessedBlock(chainId, blockNumber);
  } catch (error) {
    console.error(
      `[CACHE ERROR] Failed updating data for chain ${chainId}:`,
      error
    );
  }
}

/**
 * Start a block watcher for the specified chain
 */
export function startBlockWatcher(chainId: number = DEFAULT_CHAIN_ID): void {
  const client = getClient(chainId);

  // Initial data fetch
  client
    .getBlockNumber()
    .then((blockNumber) => {
      updateChainData(chainId, blockNumber, 0);
    })
    .catch((error) =>
      console.error(`Failed initial data fetch for chain ${chainId}:`, error)
    );

  // Subscribe to new block numbers
  const unwatchFn = client.watchBlocks({
    onBlock: (block) => {
      updateChainData(chainId, BigInt(block.number), Number(block.timestamp));
    },
    poll: true,
    pollingInterval: POLLING_INTERVAL,
  });

  console.log(`Started block watcher for chain ${chainId} (${CHAIN_ENV})`);

  // Setup fallback polling just in case
  const fallbackInterval = Math.max(POLLING_INTERVAL * 5, 5000); // At least 5s, or 5x the main polling
  const intervalId = setInterval(async () => {
    try {
      const currentBlock = await client.getBlockNumber();
      if (
        !stateCache.lastBlockProcessed[chainId] ||
        currentBlock > stateCache.lastBlockProcessed[chainId]
      ) {
        // Get the actual block with timestamp
        const block = await client.getBlock({ blockNumber: currentBlock });
        const timestamp = Number(block.timestamp);
        updateChainData(chainId, currentBlock, timestamp); // Use actual timestamp
      }
    } catch (error) {
      console.error('[ERROR] Fallback polling error:', error);
    }
  }, fallbackInterval);
}

/**
 * Manually refresh data for a specific chain
 */
export async function refreshChainData(
  chainId: number = DEFAULT_CHAIN_ID
): Promise<void> {
  const client = getClient(chainId);
  const blockNumber = await client.getBlockNumber();

  // Get the actual block with timestamp
  const block = await client.getBlock({ blockNumber });
  const timestamp = Number(block.timestamp);

  await updateChainData(chainId, blockNumber, timestamp); // Use actual timestamp
}

/**
 * Initialize the block watcher service
 */
export function initializeDataServices(
  chainId: number = DEFAULT_CHAIN_ID
): void {
  startBlockWatcher(chainId);
  console.log(`Data services initialized for chain ${chainId} (${CHAIN_ENV})`);
}
