import { Router } from 'express';
import { ContractReader } from '../utils/contractReader';

const router = Router();

router.get('/:chainId', async (req, res) => {
  try {
    const chainId = Number(req.params.chainId);
    const reader = new ContractReader(chainId);
    const prizePool = await reader.getPrizePool();

    res.json(prizePool);
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch prize pool',
      details: error,
    });
  }
});

export { router as prizePoolRouter };
