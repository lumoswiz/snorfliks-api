import { getClient } from '../contracts/clients';
import { SNORFLIKS, UI_SNORFLIKS, SPLITTER } from '../contracts/addresses';
import { SNORFLIKS_ABI, UI_SNORFLIKS_ABI } from '../contracts/abi';
import type { Address, PublicClient } from 'viem';
import { GamePhase } from '../types';

export class ContractReader {
  private client: PublicClient;
  private chainId: number;

  constructor(chainId: number) {
    this.client = getClient(chainId);
    this.chainId = chainId;
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

  async getGameState() {
    // Get all timing variables in a single multicall
    const [start, end, cooldownExpiry] = await this.client
      .multicall({
        contracts: [
          {
            address: SNORFLIKS[this.chainId],
            abi: SNORFLIKS_ABI,
            functionName: 'start',
          },
          {
            address: SNORFLIKS[this.chainId],
            abi: SNORFLIKS_ABI,
            functionName: 'end',
          },
          {
            address: SNORFLIKS[this.chainId],
            abi: SNORFLIKS_ABI,
            functionName: 'cooldownExpiry',
          },
        ],
        multicallAddress: '0xca11bde05977b3631167028862be2a173976ca11',
      })
      .then((results) =>
        results.map((r) => (r.status === 'success' ? Number(r.result) : 0))
      );

    const now = Math.floor(Date.now() / 1000);

    // Derive phase directly from timestamps (same logic as contract)
    let phase: GamePhase;
    if (start === 0) {
      phase = 'peace';
    } else if (now >= start && now < end) {
      phase = 'purge';
    } else if (now < start) {
      phase = 'imminent';
    } else {
      phase = 'peace';
    }

    // Determine next transition based on derived phase
    let nextTransition = 0;
    if (phase === 'peace') {
      nextTransition = cooldownExpiry;
    } else if (phase === 'imminent') {
      nextTransition = start;
    } else if (phase === 'purge') {
      nextTransition = end;
    }

    return {
      phase,
      blockTimestamp: now,
      start,
      end,
      cooldownExpiry,
      nextTransition,
    };
  }
}
