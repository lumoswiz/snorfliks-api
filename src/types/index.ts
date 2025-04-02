import type { Address } from 'viem';

export interface TokenInfo {
  exists: boolean;
  cooldown: boolean;
  safe: boolean;
  rank: number;
  receiveLimit: number;
  ranksToAssign: number;
}

export interface TokenInfoWithOwner {
  token: TokenInfo;
  owner: Address;
  id: bigint;
  claims: readonly [bigint, bigint, bigint, bigint];
}

export type GamePhase = 'peace' | 'imminent' | 'purge';

export interface TokensResponse {
  tokens: readonly TokenInfoWithOwner[];
  currentNonce: number;
}

export interface GamePhaseInfo {
  phase: GamePhase;
  blockTimestamp: number;
  start: number;
  end: number;
  cooldownExpiry: number;
  nextTransition: number;
}

export interface PrizePoolInfo {
  totalPrizePool: bigint;
  communityPrize: bigint;
}

export interface TotalMintedInfo {
  totalMinted: number;
}
