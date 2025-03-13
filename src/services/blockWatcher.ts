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

// Track blocks and data for debugging
const debug = {
  lastSeenBlock: 0n,
  blockCount: 0,
  lastTokenData: null as any,
  updateCount: 0,
};

/**
 * Updates data for the specified chain
 */
async function updateChainData(
  chainId: number,
  blockNumber: bigint,
  blockTimestamp: number
): Promise<void> {
  try {
    // Debug block tracking
    if (blockNumber > debug.lastSeenBlock) {
      debug.lastSeenBlock = blockNumber;
      debug.blockCount++;
      console.log(
        `[DEBUG] New block detected: ${blockNumber}, timestamp: ${blockTimestamp}, total blocks seen: ${debug.blockCount}`
      );
    } else {
      console.log(`[DEBUG] Already processed block ${blockNumber}, skipping`);
      return; // Skip already processed blocks
    }

    console.log(`[CACHE] Processing block ${blockNumber} for chain ${chainId}`);

    const reader = new ContractReader(chainId);

    // Log before fetching tokens
    console.log(
      `[CACHE] Fetching token data from blockchain for chain ${chainId}...`
    );
    const tokenData = await reader.getTokenInfos();

    // Always update the cache regardless of whether data changed
    debug.updateCount++;
    console.log(`[DEBUG] Token update #${debug.updateCount}`);
    console.log(`[CACHE] Updating tokens cache for chain ${chainId}`);
    updateTokensCache(chainId, tokenData);

    // Verify cache was updated
    console.log(
      `[DEBUG] Cache after update:`,
      stateCache.tokens[chainId]
        ? `Contains ${stateCache.tokens[chainId].tokens.length} tokens`
        : 'Empty!'
    );

    // Log before fetching prize pool
    console.log(
      `[CACHE] Fetching prize pool data from blockchain for chain ${chainId}...`
    );
    const prizePool = await reader.getPrizePool();
    console.log(
      `[CACHE] Received prize pool data: ${prizePool.totalPrizePool} total, ${prizePool.communityPrize} community`
    );

    // Always update prize pool cache
    console.log(`[CACHE] Updating prize pool cache for chain ${chainId}`);
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
      console.log(
        `[CACHE] Fetching game state data from blockchain for chain ${chainId}...`
      );
      const gameState = await reader.getGameState();
      console.log(
        `[CACHE] Received game state data: phase=${gameState.phase}, nextTransition=${gameState.nextTransition}`
      );
      updateGameStateCache(chainId, gameState);

      // Update last check time
      if (!stateCache.lastUpdateTime) stateCache.lastUpdateTime = {};
      stateCache.lastUpdateTime[chainId] = now;
    } else {
      console.log(
        `[CACHE] Skipping game state update, not needed based on timestamps`
      );
    }

    // Track last processed block
    updateLastProcessedBlock(chainId, blockNumber);

    console.log(
      `[CACHE] Successfully updated all data for chain ${chainId} at block ${blockNumber}`
    );
  } catch (error) {
    console.error(
      `[CACHE ERROR] Failed updating data for chain ${chainId}:`,
      error
    );
  }
}

// Add debug endpoint to check what's happening
export function getDebugInfo() {
  return {
    ...debug,
    lastSeenBlock: debug.lastSeenBlock.toString(),
    cacheState: {
      chainsWithTokens: Object.keys(stateCache.tokens),
      chainsWithPrizePool: Object.keys(stateCache.prizePool),
      chainsWithLastBlock: Object.keys(stateCache.lastBlockProcessed),
    },
  };
}

/**
 * Start a block watcher for the specified chain
 */
export function startBlockWatcher(chainId: number = DEFAULT_CHAIN_ID): void {
  const client = getClient(chainId);

  console.log(`[DEBUG] Starting block watcher for chain ${chainId}`);
  console.log(`[DEBUG] Using client:`, client ? 'Valid client' : 'NULL CLIENT');

  // Initial data fetch
  client
    .getBlockNumber()
    .then((blockNumber) => {
      console.log(`[DEBUG] Initial block number: ${blockNumber}`);
      updateChainData(chainId, blockNumber, 0);
    })
    .catch((error) =>
      console.error(`Failed initial data fetch for chain ${chainId}:`, error)
    );

  // Subscribe to new block numbers
  const unwatchFn = client.watchBlocks({
    onBlock: (block) => {
      console.log(
        `[DEBUG] watchBlocks fired with block: ${block.number}, timestamp: ${block.timestamp}`
      );
      updateChainData(chainId, BigInt(block.number), Number(block.timestamp));
    },
    poll: true,
    pollingInterval: POLLING_INTERVAL,
  });

  console.log(`[DEBUG] Watch function setup complete`);
  console.log(`Started block watcher for chain ${chainId} (${CHAIN_ENV})`);

  // Setup fallback polling just in case
  const fallbackInterval = Math.max(POLLING_INTERVAL * 5, 5000); // At least 5s, or 5x the main polling
  const intervalId = setInterval(async () => {
    try {
      const currentBlock = await client.getBlockNumber();
      if (currentBlock > debug.lastSeenBlock) {
        // Get the actual block with timestamp
        const block = await client.getBlock({ blockNumber: currentBlock });
        const timestamp = Number(block.timestamp);

        console.log(
          `[DEBUG] Fallback polling detected new block: ${currentBlock}, timestamp: ${timestamp}`
        );
        updateChainData(chainId, currentBlock, timestamp); // Use actual timestamp
      }
    } catch (error) {
      console.error('[DEBUG] Fallback polling error:', error);
    }
  }, fallbackInterval);

  // In 30 seconds, check if we're receiving blocks
  setTimeout(() => {
    if (debug.blockCount <= 1) {
      console.error(
        '[DEBUG] WARNING: Not receiving new blocks! Check your Foundry node.'
      );
    }
  }, 30000);
}

/**
 * Manually refresh data for a specific chain
 */
export async function refreshChainData(
  chainId: number = DEFAULT_CHAIN_ID
): Promise<void> {
  console.log(`[DEBUG] Manual refresh requested for chain ${chainId}`);
  const client = getClient(chainId);
  const blockNumber = await client.getBlockNumber();

  // Get the actual block with timestamp
  const block = await client.getBlock({ blockNumber });
  const timestamp = Number(block.timestamp);

  console.log(
    `[DEBUG] Current block for refresh: ${blockNumber}, timestamp: ${timestamp}`
  );
  await updateChainData(chainId, blockNumber, timestamp); // Use actual timestamp
}

/**
 * Initialize the block watcher service
 */
export function initializeDataServices(
  chainId: number = DEFAULT_CHAIN_ID
): void {
  console.log(`[DEBUG] Initializing data services for chain ${chainId}`);
  startBlockWatcher(chainId);
  console.log(`Data services initialized for chain ${chainId} (${CHAIN_ENV})`);
}
