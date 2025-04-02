import { Address } from 'viem';
import { foundry, sonic, sonicBlazeTestnet } from 'viem/chains';

export const SNORFLIKS: Record<number, Address> = {
  [sonic.id]: '0x2EC031219A8a19Db00BC9339E6A25B7E52ef8C46',
  [sonicBlazeTestnet.id]: '0xC2dd314688517A6b7D69E76c371045a582A9B040',
  [foundry.id]: '0xe001b3F0759683ad6357E544471Efd2B3dBf2D3a',
};

export const UI_SNORFLIKS: Record<number, Address> = {
  [sonic.id]: '0x2E76Cf8c65630BB3a7796515e1Ac27b6646E7FC7',
  [sonicBlazeTestnet.id]: '0x0FB071A1d13F0770445AfBdEDA9F5ae2b4545E32',
  [foundry.id]: '0x6FFd1A15ff62d3bA392782b5c4A7eF02Bf60f45e',
};

export const SPLITTER: Record<number, Address> = {
  [sonic.id]: '0x1Fd125ec571b2DAa1A5013C2aF7D4509Ce09486e',
  [sonicBlazeTestnet.id]: '0xc0197e8fa1A32a77E15e316322Df0fBed40F0824',
  [foundry.id]: '0x859375c27F7e2FD44379Ff8a2C162fF3B33Bb718',
};
