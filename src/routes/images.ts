import { Router } from 'express';
import axios from 'axios';
import { getCachedImage, cacheImage } from '../utils/imageCache';

const router = Router();
const BASE_CID = 'bafybeie3plyz46v5qwuwviveejrv7jw5i7m7ier4walxokz5dlmjj4tv64';
const PURGE_CID = 'bafybeic3hvxchvkuznzixfwryklfp7rbbydrue7vn6nrf2vqvpwe5gfijm';
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

router.get('/:tokenId/image', async (req, res) => {
  const { tokenId } = req.params;
  const { phase = 'peace' } = req.query;

  const cacheKey = `${tokenId}-${phase}`;
  const cachedImage = getCachedImage(cacheKey);

  if (cachedImage) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(cachedImage);
  }

  try {
    const cid = phase === 'purge' ? PURGE_CID : BASE_CID;
    const response = await axios.get(
      `https://${PINATA_GATEWAY}/ipfs/${cid}/${tokenId}.png`,
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(response.data);
    cacheImage(cacheKey, buffer);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

export const imagesRouter = router;
