import { getClient } from '../contracts/clients';
import { SNORFLIKS, UI_SNORFLIKS, SPLITTER } from '../contracts/addresses';
import { SNORFLIKS_ABI, UI_SNORFLIKS_ABI } from '../contracts/abi';
import type { Address, PublicClient } from 'viem';

export class ContractReader {
  private client: PublicClient;
  private chainId: number;

  constructor(chainId: number) {
    this.client = getClient(chainId);
    this.chainId = chainId;
  }

  async getPhase() {
    const phase = await this.client.readContract({
      address: SNORFLIKS[this.chainId],
      abi: SNORFLIKS_ABI,
      functionName: 'getPhase',
    });

    return phase === 0 ? 'peace' : phase === 1 ? 'imminent' : 'purge';
  }

  async getTokenInfos() {
    const [infos, nonce] = await this.client.readContract({
      address: UI_SNORFLIKS[this.chainId],
      abi: UI_SNORFLIKS_ABI,
      functionName: 'getInfos',
    });

    return { tokens: infos, currentNonce: Number(nonce) };
  }

  async getMaxMintable(address: Address) {
    const maxMintable = await this.client.readContract({
      address: SNORFLIKS[this.chainId],
      abi: SNORFLIKS_ABI,
      functionName: 'getMaxMintable',
      args: [address],
    });

    return Number(maxMintable);
  }

  async getPrizePool() {
    const [snorfliksBalance, splitterBalance] = await Promise.all([
      this.client.getBalance({
        address: SNORFLIKS[this.chainId],
      }),
      this.client.getBalance({
        address: SPLITTER[this.chainId],
      }),
    ]);

    const totalPrizePool = snorfliksBalance + splitterBalance;
    const communityPrize = (totalPrizePool * BigInt(7)) / BigInt(10);

    return { totalPrizePool, communityPrize };
  }
}
