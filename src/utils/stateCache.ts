import type { TokensResponse, GamePhaseInfo, PrizePoolInfo } from '../types';

export interface StateCache {
  tokens: Record<number, TokensResponse>;
  prizePool: Record<number, PrizePoolInfo>;
  gameState: Record<number, GamePhaseInfo>;
  lastBlockProcessed: Record<number, bigint>;
  lastUpdateTime: Record<number, number>;
  debug: (chainId: number) => void;
}

// Initialize the global state cache
export const stateCache: StateCache = {
  tokens: {},
  prizePool: {},
  gameState: {},
  lastBlockProcessed: {},
  lastUpdateTime: {},
  debug: (chainId: number) => {
    console.log(`[StateCache] Debug for chainId ${chainId}:`);
    console.log(`  - Has game state: ${!!stateCache.gameState[chainId]}`);
    console.log(`  - Game state type: ${typeof stateCache.gameState[chainId]}`);
    console.log(
      `  - Last update: ${stateCache.lastUpdateTime[chainId] || 'never'}`
    );

    // Add more detailed information about the game state
    if (stateCache.gameState[chainId]) {
      const state = stateCache.gameState[chainId];
      console.log(
        `  - Game phase: ${
          state.phase !== undefined ? state.phase : 'undefined'
        }`
      );
      console.log(`  - Game state keys: ${Object.keys(state).join(', ')}`);
    }
  },
};

// Update functions for each cache type
export function updateTokensCache(chainId: number, data: TokensResponse): void {
  stateCache.tokens[chainId] = data;
}

export function updatePrizePoolCache(
  chainId: number,
  data: PrizePoolInfo
): void {
  stateCache.prizePool[chainId] = data;
}

export function updateGameStateCache(
  chainId: number,
  data: GamePhaseInfo
): void {
  stateCache.gameState[chainId] = data;
}

export function updateLastProcessedBlock(
  chainId: number,
  blockNumber: bigint
): void {
  stateCache.lastBlockProcessed[chainId] = blockNumber;
}
