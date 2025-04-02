import { Router } from 'express';
import axios from 'axios';
import { cacheImage, getCachedImage } from '../utils/imageCache';
import { GamePhase } from '../types';

const router = Router();
const BASE_CID = 'bafybeie3plyz46v5qwuwviveejrv7jw5i7m7ier4walxokz5dlmjj4tv64';
const PURGE_CID = 'bafybeic3hvxchvkuznzixfwryklfp7rbbydrue7vn6nrf2vqvpwe5gfijm';
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
const GATEWAY_TOKEN = process.env.PINATA_GATEWAY_TOKEN;

router.get('/:tokenId/image', async (req, res) => {
  const { tokenId } = req.params;
  const phase = (req.query.phase as GamePhase) || 'peace';

  try {
    const cachedImage = getCachedImage(tokenId, phase);
    if (cachedImage) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cachedImage);
    }

    const cid = phase === 'purge' ? PURGE_CID : BASE_CID;

    const headers: Record<string, string> = {};
    if (GATEWAY_TOKEN) {
      headers['x-pinata-gateway-token'] = GATEWAY_TOKEN;
    }

    const response = await axios.get(
      `https://${PINATA_GATEWAY}/ipfs/${cid}/${tokenId}.png`,
      {
        responseType: 'arraybuffer',
        headers,
      }
    );

    const imageBuffer = Buffer.from(response.data);
    cacheImage(tokenId, imageBuffer, phase);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Cache', 'MISS');
    res.send(imageBuffer);
  } catch (error) {
    console.error(`Error fetching image for token ${tokenId}:`, error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

export const imagesRouter = router;
