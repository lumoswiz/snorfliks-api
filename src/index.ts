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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    return originalJson.call(
      this,
      JSON.parse(
        JSON.stringify(body, (key, value) => {
          if (typeof value === 'bigint') {
            // Only convert bigints to strings
            return value.toString();
          }
          // Keep regular numbers as numbers
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

// Initialize data services
initializeDataServices();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
