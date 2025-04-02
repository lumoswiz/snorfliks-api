import NodeCache from 'node-cache';
import { GamePhase } from '../types';

const peaceCache = new NodeCache({
  stdTTL: 86400,
  checkperiod: 3600,
  useClones: false,
  maxKeys: 2500,
});

const purgeCache = new NodeCache({
  stdTTL: 10800,
  checkperiod: 1800,
  useClones: false,
  maxKeys: 2500,
});

export const cacheImage = (
  tokenId: string,
  buffer: Buffer,
  phase: GamePhase
): void => {
  const cache = phase === 'purge' ? purgeCache : peaceCache;
  cache.set(tokenId, buffer);
};

export const getCachedImage = (
  tokenId: string,
  phase: GamePhase
): Buffer | undefined => {
  const cache = phase === 'purge' ? purgeCache : peaceCache;
  return cache.get<Buffer>(tokenId);
};

export const clearCache = (phase: GamePhase): void => {
  const cache = phase === 'purge' ? purgeCache : peaceCache;
  cache.flushAll();
  console.log(`[ImageCache] ${phase} cache cleared`);
};
