import type { Address } from 'viem';

export interface TokenInfo {
  exists: boolean;
  cooldown: boolean;
  safe: boolean;
  rank: number;
  receiveLimit: number;
  ranksToAssign: number;
  owner: Address;
  id: BigInt;
  claims?: readonly [bigint, bigint, bigint, bigint];
}

export type GamePhase = 'peace' | 'imminent' | 'purge';

export interface TokensResponse {
  tokens: TokenInfo[];
  currentNonce: number;
}

export interface GameStateResponse {
  phase: GamePhase;
  cooldownExpiry?: number;
}

export interface MaxMintableResponse {
  maxMintable: number;
  address: Address;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
