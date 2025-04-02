import {
  createPublicClient,
  http,
  fallback,
  Transport,
  PublicClient,
} from 'viem';
import { sonic } from 'viem/chains';

function getTransports(): Transport[] {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (!alchemyKey) throw new Error('ALCHEMY_API_KEY not found');

  return [
    http('https://rpc.soniclabs.com'),
    http('https://rpc.ankr.com/sonic_mainnet'),
    http(`https://sonic-mainnet.g.alchemy.com/v2/${alchemyKey}`),
  ];
}

// Create a single client for Sonic
const sonicClient = createPublicClient({
  chain: sonic,
  transport: fallback(getTransports(), { rank: true }),
});

// Export the client map with only Sonic
export const clients: Record<number, PublicClient> = {
  [sonic.id]: sonicClient,
};

export function getClient(chainId: number): PublicClient {
  if (chainId !== sonic.id) {
    throw new Error(
      `Only Sonic chain (ID: ${sonic.id}) is supported in production`
    );
  }

  return sonicClient;
}
