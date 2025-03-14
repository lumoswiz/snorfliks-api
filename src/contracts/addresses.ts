import { Address } from 'viem';
import { foundry, sonic, sonicBlazeTestnet } from 'viem/chains';

export const SNORFLIKS: Record<number, Address> = {
  [sonic.id]: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4',
  [sonicBlazeTestnet.id]: '0xA661DEFab801A08C7F0423A4a3B0815f8071b70B',
  [foundry.id]: '0xe001b3F0759683ad6357E544471Efd2B3dBf2D3a',
};

export const UI_SNORFLIKS: Record<number, Address> = {
  [sonic.id]: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4',
  [sonicBlazeTestnet.id]: '0x72c9b5CeDe19E5213Cd59025081e6F665E9564a3',
  [foundry.id]: '0x6FFd1A15ff62d3bA392782b5c4A7eF02Bf60f45e',
};

export const SPLITTER: Record<number, Address> = {
  [sonic.id]: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4', // dummy
  [sonicBlazeTestnet.id]: '0x863aF0F649E4E0A2214330B46BBe1F24314445C7',
  [foundry.id]: '0x859375c27F7e2FD44379Ff8a2C162fF3B33Bb718',
};
