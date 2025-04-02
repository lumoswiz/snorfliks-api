import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).send('OK');
});

router.get('/readiness', async (req, res) => {
  try {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRouter };
