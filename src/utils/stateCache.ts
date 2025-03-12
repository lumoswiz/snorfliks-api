import type { TokensResponse, GamePhaseInfo, PrizePoolInfo } from '../types';

export interface StateCache {
  tokens: Record<number, TokensResponse>;
  prizePool: Record<number, PrizePoolInfo>;
  gameState: Record<number, GamePhaseInfo>;
  lastBlockProcessed: Record<number, bigint>;
  lastUpdateTime: Record<number, number>;
}

// Initialize the global state cache
export const stateCache: StateCache = {
  tokens: {},
  prizePool: {},
  gameState: {},
  lastBlockProcessed: {},
  lastUpdateTime: {},
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
