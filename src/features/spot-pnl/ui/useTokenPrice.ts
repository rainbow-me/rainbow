import { useLiveTokenValue } from '@/components/live-token-text/useLiveTokenValue';
import { getUniqueId } from '@/entities/assetId';
import type { NativeCurrencyKey } from '@/features/currency/types';
import type { ChainId } from '@/features/network/types/backendNetworks';
import useAccountAsset from '@/hooks/useAccountAsset';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';

/** The token's live native price, until a quote arrives the selected wallet's or the fetched token's price; `''` without either. */
export function useTokenPrice({
  chainId,
  nativeCurrency,
  tokenAddress,
}: {
  chainId: ChainId;
  nativeCurrency: NativeCurrencyKey;
  tokenAddress: string;
}): string {
  const uniqueId = getUniqueId(tokenAddress, chainId);
  const accountAsset = useAccountAsset(uniqueId, nativeCurrency);
  const { data: externalToken } = useExternalToken({ address: tokenAddress, chainId, currency: nativeCurrency });
  return useLiveTokenValue({
    tokenId: uniqueId,
    fallback: accountAsset?.native?.price?.amount ?? externalToken?.native?.price?.amount ?? '',
    fallbackUpdatedAt: accountAsset?.price?.changed_at ?? 0,
  });
}
