import NodeCache from 'node-cache';

const imageCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // 10 minutes
  useClones: false,
});

export const cacheImage = (key: string, buffer: Buffer) => {
  imageCache.set(key, buffer);
};

export const getCachedImage = (key: string): Buffer | undefined => {
  return imageCache.get(key);
};
