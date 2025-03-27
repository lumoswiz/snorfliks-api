import { Router } from 'express';
import { stateCache } from '../utils/stateCache';
import { refreshChainData } from '../services/blockWatcher';

const router = Router();

// Get game state for a specific chain
router.get('/:chainId', async (req, res) => {
  try {
    const chainId = Number(req.params.chainId);

    // Check if we need to force refresh the data
    const forceRefresh = req.query.refresh === 'true';

    // If cache is empty or force refresh requested, refresh the data
    if (forceRefresh || !stateCache.gameState[chainId]) {
      await refreshChainData(chainId);
    }

    // Return from cache (which should now be populated)
    if (stateCache.gameState[chainId]) {
      return res.json({
        ...(stateCache.gameState[chainId] || {}),
        _cached: true,
        _cacheTime: stateCache.lastUpdateTime?.[chainId] || 0,
      });
    }

    // If still no data, return error
    res.status(500).json({
      code: 'DATA_UNAVAILABLE',
      message: 'Failed to fetch game state data',
    });
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch game state',
      details: error,
    });
  }
});

export { router as gameStateRouter };
