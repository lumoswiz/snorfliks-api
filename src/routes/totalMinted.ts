import { Router } from 'express';
import { createCachedEndpoint } from '../utils/routeHelpers';

const router = Router();
router.get('/:chainId', createCachedEndpoint('totalMinted'));

export { router as totalMintedRouter };
