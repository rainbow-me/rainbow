import { type ChainId } from '@/features/network/types/backendNetworks';
import { type SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';

export function getUniqueId(address: string, chainId: ChainId | typeof SOLANA_CHAIN_ID): string {
  'worklet';
  return `${address}_${chainId}`;
}
