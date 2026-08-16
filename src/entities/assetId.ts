import { type ChainId } from '@/features/network/types/backendNetworks';

export function getUniqueId(address: string, chainId: ChainId): string {
  'worklet';
  return `${address}_${chainId}`;
}
