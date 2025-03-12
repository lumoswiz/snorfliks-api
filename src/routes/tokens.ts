import { Router } from 'express';
import { ContractReader } from '../utils/contractReader';
import { stateCache } from '../utils/stateCache';
import { refreshChainData } from '../services/blockWatcher';

const router = Router();

// Get all tokens for a specific chain
router.get('/:chainId', async (req, res) => {
  try {
    const chainId = Number(req.params.chainId);

    // Check if we need to force refresh the data
    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      await refreshChainData(chainId);
    }

    // Check cache first
    if (stateCache.tokens[chainId]) {
      return res.json(stateCache.tokens[chainId]);
    }

    // Fallback to direct fetch if not cached
    await refreshChainData(chainId);

    // Now the cache should be populated
    if (stateCache.tokens[chainId]) {
      return res.json(stateCache.tokens[chainId]);
    }

    // If still no data, fetch directly
    const reader = new ContractReader(chainId);
    const tokenData = await reader.getTokenInfos();
    res.json(tokenData);
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch tokens',
      details: error,
    });
  }
});

export const tokensRouter = router;
