import { Request, Response } from 'express';
import { stateCache } from './stateCache';
import { refreshChainData } from '../services/blockWatcher';

// Only allow keys that map to records, excluding function keys like 'debug'
type CacheDataKey = Exclude<keyof typeof stateCache, 'debug'>;

export const createCachedEndpoint = (cacheKey: CacheDataKey) => {
  return async (req: Request, res: Response) => {
    try {
      const chainId = Number(req.params.chainId);
      const forceRefresh = req.query.refresh === 'true';

      if (forceRefresh || !stateCache[cacheKey][chainId]) {
        await refreshChainData(chainId);
      }

      if (stateCache[cacheKey][chainId]) {
        return res.json({
          ...(stateCache[cacheKey][chainId] || ({} as any)),
          _cached: true,
          _cacheTime: stateCache.lastUpdateTime?.[chainId] || 0,
        });
      }

      res.status(500).json({
        code: 'DATA_UNAVAILABLE',
        message: `Failed to fetch ${cacheKey} data`,
      });
    } catch (error) {
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: `Failed to fetch ${cacheKey}`,
        details: error,
      });
    }
  };
};
