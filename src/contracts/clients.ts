import {
  createPublicClient,
  http,
  fallback,
  Transport,
  PublicClient,
} from 'viem';
import { foundry, sonic, sonicBlazeTestnet } from 'viem/chains';

function getTransports(chainId: number): Transport[] {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (!alchemyKey) throw new Error('ALCHEMY_API_KEY not found');

  switch (chainId) {
    case sonic.id:
      return [
        http('https://rpc.soniclabs.com'),
        http('https://rpc.ankr.com/sonic_mainnet'),
        http(`https://sonic-mainnet.g.alchemy.com/v2/${alchemyKey}`),
      ];
    case sonicBlazeTestnet.id:
      return [
        http(`https://sonic-blaze.g.alchemy.com/v2/${alchemyKey}`),
        http('https://rpc.blaze.soniclabs.com'),
        http('https://rpc.ankr.com/sonic_testnet'),
      ];
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

const baseClients: Record<number, PublicClient> = {
  [sonic.id]: createPublicClient({
    chain: sonic,
    transport: fallback(getTransports(sonic.id), { rank: true }),
  }),
  [sonicBlazeTestnet.id]: createPublicClient({
    chain: sonicBlazeTestnet,
    transport: fallback(getTransports(sonicBlazeTestnet.id), { rank: true }),
  }),
};

export const clients = baseClients;

export function getClient(chainId: number): PublicClient {
  if (clients[chainId]) {
    return clients[chainId];
  }

  if (chainId === foundry.id) {
    return createPublicClient({
      chain: foundry,
      transport: http('http://127.0.0.1:8545'),
    });
  }

  throw new Error(`No client for chain ID: ${chainId}`);
}
