import { Address } from 'viem';
import { foundry, sonic, sonicBlazeTestnet } from 'viem/chains';

export const SNORFLIKS: Record<number, Address> = {
  [sonic.id]: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4',
  [sonicBlazeTestnet.id]: '0xAcf316400dC04681BDdcA241A40b738C7101117A',
  [foundry.id]: '0xe001b3F0759683ad6357E544471Efd2B3dBf2D3a',
};

export const UI_SNORFLIKS: Record<number, Address> = {
  [sonic.id]: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4',
  [sonicBlazeTestnet.id]: '0x45a08D36D42Ac727A326ABA3d1349daAadF964F6',
  [foundry.id]: '0x6FFd1A15ff62d3bA392782b5c4A7eF02Bf60f45e',
};

export const SPLITTER: Record<number, Address> = {
  [sonic.id]: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4', // dummy
  [sonicBlazeTestnet.id]: '0x0469275996fD4aF18672C5e43FC9B89869D73290',
  [foundry.id]: '0x859375c27F7e2FD44379Ff8a2C162fF3B33Bb718',
};
