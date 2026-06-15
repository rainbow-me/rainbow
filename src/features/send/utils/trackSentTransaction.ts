import { analytics } from '@/analytics';
import { toAnalyticsAmount } from '@/analytics/utils';
import { type ParsedAddressAsset } from '@/entities/tokens';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { assetIsParsedAddressAsset } from '@/handlers/web3';
import { ensureError, logger } from '@/logger';
import { type ChainId } from '@/state/backendNetworks/types';

type TrackSentTransactionParams = {
  asset: ParsedAddressAsset | UniqueAsset | undefined;
  assetAmount: string;
  chainId: ChainId;
  isHardwareWallet: boolean;
  isSponsored: boolean;
  nativeAmount: string;
  recipient: string;
  submitSuccessful: boolean;
};

export async function trackSentTransaction({
  asset,
  assetAmount,
  chainId,
  isHardwareWallet,
  isSponsored,
  nativeAmount,
  recipient,
  submitSuccessful,
}: TrackSentTransactionParams): Promise<void> {
  try {
    analytics.track(analytics.event.sentTransaction, {
      assetName: asset?.name || '',
      assetSymbol: asset && assetIsParsedAddressAsset(asset) ? asset.symbol : undefined,
      assetAmount: toAnalyticsAmount(assetAmount),
      usdValue: await getUsdValue(nativeAmount),
      network: asset?.network || '',
      chainId,
      isSponsored,
      isRecepientENS: recipient.slice(-4).toLowerCase() === '.eth',
      isHardwareWallet,
      submitSuccessful,
    });
  } catch (error) {
    logger.warn('[trackSentTransaction]: failed to track', { error: ensureError(error) });
  }
}

async function getUsdValue(nativeAmount: string): Promise<number | undefined> {
  const amount = toAnalyticsAmount(nativeAmount);
  if (amount === undefined) {
    return undefined;
  }

  const store = useCurrencyConversionStore.getState();
  // fetch() returns null on a failed refetch even when a cached rate exists,
  // so fall back to the cached data before treating the rate as unavailable.
  const data = (await store.fetch()) ?? store.getData();
  const rate = data?.usdToNativeCurrencyConversionRate;
  if (rate == null || !Number.isFinite(rate) || rate <= 0) {
    return undefined;
  }

  return toAnalyticsAmount(store.convertToUsd(amount));
}
