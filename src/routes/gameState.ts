import { Router } from 'express';
import { createCachedEndpoint } from '../utils/routeHelpers';

const router = Router();
router.get('/:chainId', createCachedEndpoint('gameState'));

export { router as gameStateRouter };
