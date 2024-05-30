import { ETH_ADDRESS } from '@rainbow-me/swaps';
import { zeroAddress } from 'viem';

const eth = ETH_ADDRESS.toLowerCase();
export const isEth = (address: string) => [eth, zeroAddress, 'eth'].includes(address.toLowerCase());

export const isSameAddress = (a: string, b: string) => {
  if (isEth(a) && isEth(b)) return true;
  return a.toLowerCase() === b.toLowerCase();
};
