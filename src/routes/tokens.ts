import { Router } from 'express';
import { stateCache } from '../utils/stateCache';
import { refreshChainData } from '../services/blockWatcher';

const router = Router();

// Get all tokens for a specific chain
router.get('/:chainId', async (req, res) => {
  try {
    const chainId = Number(req.params.chainId);

    // Check if we need to force refresh the data
    const forceRefresh = req.query.refresh === 'true';

    // If cache is empty or force refresh requested, refresh the data
    if (forceRefresh || !stateCache.tokens[chainId]) {
      await refreshChainData(chainId);
    }

    // Return from cache (which should now be populated)
    if (stateCache.tokens[chainId]) {
      return res.json({
        ...(stateCache.tokens[chainId] || {}),
        _cached: true,
        _cacheTime: stateCache.lastUpdateTime?.[chainId] || 0,
      });
    }

    // If still no data, return error
    res.status(500).json({
      code: 'DATA_UNAVAILABLE',
      message: 'Failed to fetch token data',
    });
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch tokens',
      details: error,
    });
  }
});

export const tokensRouter = router;
