import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { type ChainId } from '@/features/network/types/backendNetworks';

export function resolveDefaultSlippage(chainId: ChainId): number {
  const slippageString = getDefaultSlippage(chainId, getRemoteConfig().default_slippage_bips_chainId);
  const parsed = Number(slippageString);
  return Number.isFinite(parsed) ? parsed : 1;
}
