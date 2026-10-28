import { type ChainId } from '@/features/network/types/backendNetworks';
import { isNativeAsset } from '@/handlers/assets';

/** Whether P&L is meaningful for the token; `type` is its metadata type, and the token is ineligible until that loads. */
export function isSpotPnlEligible({ address, chainId, type }: { address: string; chainId: ChainId; type: string | undefined }) {
  return type !== undefined && type !== 'stablecoin' && type !== 'native' && !isNativeAsset(address, chainId);
}
