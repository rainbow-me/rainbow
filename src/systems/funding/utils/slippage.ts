import { getDefaultSlippage } from '@/__swaps__/utils/swaps';
import { getRemoteConfig } from '@/model/remoteConfig';
import { type ChainId } from '@/state/backendNetworks/types';

export function resolveDefaultSlippage(chainId: ChainId): number {
  const slippageString = getDefaultSlippage(chainId, getRemoteConfig().default_slippage_bips_chainId);
  const parsed = Number(slippageString);
  return Number.isFinite(parsed) ? parsed : 1;
}
