import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { gameStateRouter } from './routes/gameState';
import { tokensRouter } from './routes/tokens';
import { maxMintableRouter } from './routes/maxMintable';
import { imagesRouter } from './routes/images';
import { prizePoolRouter } from './routes/prizePool';
import { cycleNonceRouter } from './routes/cycleNonce';
import { totalMintedRouter } from './routes/totalMinted';
import { healthRouter } from './routes/health';
import { initializeDataServices } from './services/blockWatcher';
import { requestLogger } from './middleware/requestLogger';
import helmet from 'helmet';
import {
  globalErrorHandler,
  uncaughtExceptionHandler,
} from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;
const CHAIN_ENV = process.env.CHAIN_ENV || 'foundry';

app.use(helmet());

// Conditional CORS based on environment
if (CHAIN_ENV === 'sonic') {
  // Production mode - restrict to specific origins
  app.use(
    cors({
      origin: ['https://www.snorfliks.xyz', 'https://snorfliks.xyz'],
      methods: ['GET', 'OPTIONS'],
      maxAge: 86400,
    })
  );
  console.log('CORS: Production mode - restricting origins');
} else {
  // Development mode - allow all origins
  app.use(cors());
  console.log('CORS: Development mode - allowing all origins');
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

app.use(requestLogger);

// Routes
app.use('/api/game-state', gameStateRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/max-mintable', maxMintableRouter);
app.use('/api/prize-pool', prizePoolRouter);
app.use('/api/images', imagesRouter);
app.use('/api/cycle-nonce', cycleNonceRouter);
app.use('/api/total-minted', totalMintedRouter);
app.use('/api/health', healthRouter);

app.use(globalErrorHandler);

uncaughtExceptionHandler();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${CHAIN_ENV} environment`);

  initializeDataServices();
});
