import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { Address } from 'viem';
import { ParsedAsset } from '@/__swaps__/types/assets';
import { assetNeedsUnlocking } from '@/raps/actions/unlock';
import { ATOMIC_SWAPS, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { getCanDelegate } from '@rainbow-me/delegation';

export const getShouldDelegate = async (chainId: number, quote: Quote | CrosschainQuote | QuoteError, assetToSell?: ParsedAsset | null) => {
  if (!assetToSell || 'error' in quote) return false;
  const canDelegate = getCanDelegate(chainId);
  const needsUnlocking = await assetNeedsUnlocking({
    owner: quote.from as `0x${string}`,
    amount: quote.sellAmount.toString(),
    assetToUnlock: assetToSell,
    spender: quote.from as `0x${string}`,
    chainId: chainId,
  });
  return canDelegate && needsUnlocking;
};

export const useShouldDelegate = (chainId: number, quote: Quote | CrosschainQuote, assetToSell?: ParsedAsset | null) => {
  const atomicSwapsEnabled = useExperimentalFlag(ATOMIC_SWAPS);
  const config = useRemoteConfig();
  const shouldDelegate = (atomicSwapsEnabled || config.atomic_swaps_enabled) && getShouldDelegate(chainId, quote, assetToSell);
  return shouldDelegate;
};
