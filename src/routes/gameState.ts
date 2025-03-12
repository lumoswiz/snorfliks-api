import { Router } from 'express';
import { ContractReader } from '../utils/contractReader';
import { stateCache } from '../utils/stateCache';
import { refreshChainData } from '../services/blockWatcher';

const router = Router();

// Get game state for a specific chain
router.get('/:chainId', async (req, res) => {
  try {
    const chainId = Number(req.params.chainId);

    // Check if we need to force refresh the data
    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      await refreshChainData(chainId);
    }

    // Check cache first
    if (stateCache.gameState[chainId]) {
      return res.json(stateCache.gameState[chainId]);
    }

    // Fallback to direct fetch if not cached
    await refreshChainData(chainId);

    // Now the cache should be populated
    if (stateCache.gameState[chainId]) {
      return res.json(stateCache.gameState[chainId]);
    }

    // If still no data, fetch directly
    const reader = new ContractReader(chainId);
    const gameStateData = await reader.getGameState();
    res.json(gameStateData);
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch game state',
      details: error,
    });
  }
});

export { router as gameStateRouter };
