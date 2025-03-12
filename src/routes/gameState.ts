import { Router } from 'express';
import { ContractReader } from '../utils/contractReader';
import { sonic } from 'viem/chains';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const reader = new ContractReader(sonic.id);
    const phase = await reader.getPhase();
    res.json({ phase });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

export const gameStateRouter = router;
