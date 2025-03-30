import { getClient } from '../contracts/clients';
import { SNORFLIKS, UI_SNORFLIKS, SPLITTER } from '../contracts/addresses';
import { SNORFLIKS_ABI, UI_SNORFLIKS_ABI } from '../contracts/abi';
import type { Address, PublicClient } from 'viem';
import { GamePhase } from '../types';

export class ContractReader {
  public client: PublicClient;
  private chainId: number;

  constructor(chainId: number) {
    this.client = getClient(chainId);
    this.chainId = chainId;
  }

  /**
   * Get all data in a single optimized call for the block watcher
   */
  async getAllData(blockNumber?: bigint, blockTimestamp?: number) {
    // Use passed values or fetch fresh ones
    const currentBlock = blockNumber || (await this.client.getBlockNumber());
    let timestamp = blockTimestamp;

    if (timestamp === undefined) {
      const block = await this.client.getBlock({ blockNumber: currentBlock });
      timestamp = Number(block.timestamp);
    }

    // Now timestamp is guaranteed to be defined
    const blockTime = timestamp;

    // Combine all contract reads into a single multicall
    const results = await this.client.multicall({
      contracts: [
        // UI_SNORFLIKS getInfos call
        {
          address: UI_SNORFLIKS[this.chainId],
          abi: UI_SNORFLIKS_ABI,
          functionName: 'getInfos',
        },
        // Game state timing variables
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
    });

    // Process token infos
    const tokenInfoResult =
      results[0].status === 'success' ? results[0].result : [[], 0];
    const tokens = {
      tokens: tokenInfoResult[0],
      currentNonce: Number(tokenInfoResult[1]),
    };

    // Process game state
    const start =
      results[1].status === 'success' ? Number(results[1].result) : 0;
    const end = results[2].status === 'success' ? Number(results[2].result) : 0;
    const cooldownExpiry =
      results[3].status === 'success' ? Number(results[3].result) : 0;

    // Derive phase directly from timestamps
    let phase: GamePhase;
    if (start === 0) {
      phase = 'peace';
    } else if (blockTime >= start && blockTime < end) {
      phase = 'purge';
    } else if (blockTime < start) {
      phase = 'imminent';
    } else {
      phase = 'peace';
    }

    // Determine next transition
    let nextTransition = 0;
    if (phase === 'peace') {
      nextTransition = cooldownExpiry;
    } else if (phase === 'imminent') {
      nextTransition = start;
    } else if (phase === 'purge') {
      nextTransition = end;
    }

    const gameState = {
      phase,
      blockTimestamp: blockTime,
      start,
      end,
      cooldownExpiry,
      nextTransition,
    };

    // Get prize pool data in parallel
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
    const prizePool = { totalPrizePool, communityPrize };

    // Return all data at once
    return {
      tokens,
      gameState,
      prizePool,
      blockNumber: currentBlock,
      blockTimestamp: blockTime,
    };
  }

  /**
   * Only keep this method as it's directly called by maxMintableRouter
   */
  async getMaxMintable(address: Address) {
    const maxMintable = await this.client.readContract({
      address: SNORFLIKS[this.chainId],
      abi: SNORFLIKS_ABI,
      functionName: 'getMaxMintable',
      args: [address],
    });

    return Number(maxMintable);
  }
}
