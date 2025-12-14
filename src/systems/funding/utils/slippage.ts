import { getRemoteConfig } from '@/model/remoteConfig';
import { ChainId } from '@/state/backendNetworks/types';
import { getDefaultSlippage } from '@/__swaps__/utils/swaps';

export function resolveDefaultSlippage(chainId: ChainId): number {
  const slippageString = getDefaultSlippage(chainId, getRemoteConfig().default_slippage_bips_chainId);
  const parsed = Number(slippageString);
  return Number.isFinite(parsed) ? parsed : 1;
}
