import { Router } from 'express';
import { ContractReader } from '../utils/contractReader';
import { getChainId } from '../utils/routeHelpers';
import type { Address } from 'viem';

const router = Router();

router.get('/:chainId/:address', async (req, res) => {
  try {
    const chainId = getChainId(req.params.chainId);
    const address = req.params.address as Address;

    const reader = new ContractReader(chainId);
    const maxMintable = await reader.getMaxMintable(address);

    res.json({ maxMintable, address });
  } catch (error) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch max mintable amount',
      details: error,
    });
  }
});

export { router as maxMintableRouter };
