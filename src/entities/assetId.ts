import { type SupportedChainId } from '@/features/network/types/supportedChainId';

export function getUniqueId(address: string, chainId: SupportedChainId): string {
  'worklet';
  return `${address}_${chainId}`;
}
