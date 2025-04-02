import { Router } from 'express';
import { stateCache } from '../utils/stateCache';

const router = Router();

// Get current nonce by chainId
router.get('/:chainId', async (req, res) => {
  try {
    const chainId = Number(req.params.chainId);

    // Check if we have tokens data with nonce
    if (stateCache.tokens[chainId]?.currentNonce !== undefined) {
      return res.json({
        cycleId: stateCache.tokens[chainId].currentNonce,
        _cached: true,
        _cacheTime: stateCache.lastUpdateTime?.[chainId] || 0,
      });
    }

    res.status(404).json({
      code: 'NONCE_UNAVAILABLE',
      message: 'No nonce data available for this chain',
    });
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch cycle nonce',
      details: error,
    });
  }
});

export { router as cycleNonceRouter };
