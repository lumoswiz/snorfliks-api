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
import type { TokensResponse, GamePhaseInfo, PrizePoolInfo } from '../types';

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
const POLLING_INTERVAL = Number(process.env.POLLING_INTERVAL || 1000); // Default 1s, configurable via env

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

    // Get all data in a single optimized call
    const { tokens, gameState, prizePool } = await reader.getAllData();

    // Update all caches
    updateTokensCache(chainId, tokens as TokensResponse);
    updatePrizePoolCache(chainId, prizePool as PrizePoolInfo);
    updateGameStateCache(chainId, gameState as GamePhaseInfo);

    // Update last check time
    if (!stateCache.lastUpdateTime) stateCache.lastUpdateTime = {};
    stateCache.lastUpdateTime[chainId] = blockTimestamp;

    // Track last processed block
    updateLastProcessedBlock(chainId, blockNumber);

    console.log(
      `[BlockWatcher] Updated data for chain ${chainId}, block ${blockNumber}, phase: ${gameState.phase}`
    );
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
  let isWatcherFunctioning = true;
  let fallbackIntervalId: NodeJS.Timeout | null = null;

  // Subscribe to new block numbers
  const unwatchFn = client.watchBlocks({
    onBlock: (block) => {
      isWatcherFunctioning = true;
      // If fallback was running and watcher is now working, clear the fallback
      if (fallbackIntervalId) {
        clearInterval(fallbackIntervalId);
        fallbackIntervalId = null;
        console.log(
          `[BlockWatcher] Primary watcher resumed for chain ${chainId}, stopping fallback`
        );
      }
      updateChainData(chainId, BigInt(block.number), Number(block.timestamp));
    },
    onError: (error) => {
      console.error(
        `[BlockWatcher] Error in block watcher for chain ${chainId}:`,
        error
      );
      isWatcherFunctioning = false;

      // Start fallback polling if not already running
      if (!fallbackIntervalId) {
        console.log(
          `[BlockWatcher] Starting fallback polling for chain ${chainId}`
        );
        startFallbackPolling();
      }
    },
    poll: true,
    pollingInterval: POLLING_INTERVAL,
  });

  console.log(`Started block watcher for chain ${chainId} (${CHAIN_ENV})`);

  // Function to start fallback polling with the same interval as the main watcher
  function startFallbackPolling() {
    if (fallbackIntervalId) return;

    fallbackIntervalId = setInterval(async () => {
      try {
        const currentBlock = await client.getBlockNumber();
        if (
          !stateCache.lastBlockProcessed[chainId] ||
          currentBlock > stateCache.lastBlockProcessed[chainId]
        ) {
          // Get the actual block with timestamp
          const block = await client.getBlock({ blockNumber: currentBlock });
          const timestamp = Number(block.timestamp);
          updateChainData(chainId, currentBlock, timestamp);
        }
      } catch (error) {
        console.error('[ERROR] Fallback polling error:', error);
      }
    }, POLLING_INTERVAL);
  }
}

/**
 * Manually refresh data for a specific chain
 */
export async function refreshChainData(
  chainId: number = DEFAULT_CHAIN_ID
): Promise<void> {
  console.log(`[BlockWatcher] Refreshing chain data for chainId: ${chainId}`);
  try {
    const reader = new ContractReader(chainId);

    // Get all data in a single optimized call
    const { tokens, gameState, prizePool, blockNumber } =
      await reader.getAllData();

    // Update all caches
    updateTokensCache(chainId, tokens as TokensResponse);
    updatePrizePoolCache(chainId, prizePool as PrizePoolInfo);
    updateGameStateCache(chainId, gameState as GamePhaseInfo);

    // Update timestamps
    stateCache.lastUpdateTime[chainId] = Date.now();
    updateLastProcessedBlock(chainId, BigInt(blockNumber));

    console.log(
      `[BlockWatcher] Manually refreshed data for chainId ${chainId}, phase: ${gameState.phase}`
    );
  } catch (error) {
    console.error(
      `[BlockWatcher] Error refreshing chain data for chainId ${chainId}:`,
      error
    );
  }
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
