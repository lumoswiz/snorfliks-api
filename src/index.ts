import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { gameStateRouter } from './routes/gameState';
import { tokensRouter } from './routes/tokens';
import { maxMintableRouter } from './routes/maxMintable';
import { imagesRouter } from './routes/images';
import { prizePoolRouter } from './routes/prizePool';
import { initializeDataServices } from './services/blockWatcher';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const PORT = process.env.PORT || 3000;
const CHAIN_ENV = process.env.CHAIN_ENV || 'foundry';

// Add request logger before other middleware
app.use(requestLogger);

// Conditional CORS based on environment
if (CHAIN_ENV === 'foundry') {
  // Development mode - allow all origins
  app.use(cors());
  console.log('CORS: Development mode - allowing all origins');
} else {
  // Production mode - restrict to specific origins
  app.use(
    cors({
      origin: ['https://www.snorfliks.xyz', 'https://snorfliks.xyz'],
      methods: ['GET', 'OPTIONS'],
      maxAge: 86400,
    })
  );
  console.log('CORS: Production mode - restricting origins');
}

app.use(express.json());

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    return originalJson.call(
      this,
      JSON.parse(
        JSON.stringify(body, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        })
      )
    );
  };
  next();
});

// Routes
app.use('/api/game-state', gameStateRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/max-mintable', maxMintableRouter);
app.use('/api/prize-pool', prizePoolRouter);
app.use('/api/images', imagesRouter);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${CHAIN_ENV} environment`);

  initializeDataServices();
});
