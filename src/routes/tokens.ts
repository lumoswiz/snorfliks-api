import { Router } from 'express';
import { ContractReader } from '../utils/contractReader';
import { sonic } from 'viem/chains';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const reader = new ContractReader(sonic.id);
    const tokenData = await reader.getTokenInfos();
    res.json(tokenData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

router.get('/purged', async (req, res) => {
  try {
    const reader = new ContractReader(sonic.id);
    const { tokens } = await reader.getTokenInfos();
    const purgedTokens = tokens.filter((token) => !token.token.exists);
    res.json(purgedTokens);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purged tokens' });
  }
});

export const tokensRouter = router;
