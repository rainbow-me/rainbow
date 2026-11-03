import { useLiveTokenValue } from '@/components/live-token-text/useLiveTokenValue';
import { getUniqueId } from '@/entities/assetId';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import type { NativeCurrencyKey } from '@/features/currency/types';
import type { ChainId } from '@/features/network/types/backendNetworks';
import { greaterThanWorklet } from '@/framework/core/safeMath';
import useAdditionalAssetData from '@/hooks/useAdditionalAssetData';
import { type TokenData } from '@/state/liveTokens/types';

import { resolveCirculatingSupply } from '../core/marketCapSupply';

/** The token's circulating supply while its per-token figures show as market caps, from its live or fetched market cap. */
export function useCirculatingSupply({
  chainId,
  nativeCurrency,
  price,
  tokenAddress,
}: {
  chainId: ChainId;
  nativeCurrency: NativeCurrencyKey;
  /** Native, live. */
  price: string;
  tokenAddress: string;
}): string | null {
  const usdToNativeRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate);
  const { data: metadata } = useAdditionalAssetData({ address: tokenAddress, chainId, currency: nativeCurrency });
  const liveMarketCap = useLiveTokenValue({
    tokenId: getUniqueId(tokenAddress, chainId),
    fallback: '0',
    selector: selectCirculatingMarketCap,
  });
  const marketCap = greaterThanWorklet(liveMarketCap, 0) ? liveMarketCap : String(metadata?.marketCap ?? 0);
  return resolveCirculatingSupply({ marketCap, price, usdToNativeRate });
}

function selectCirculatingMarketCap(token: TokenData): string {
  return token.marketData.circulatingMarketCap;
}
