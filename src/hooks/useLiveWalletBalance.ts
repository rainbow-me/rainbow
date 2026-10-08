import { createDerivedStore } from '@storesjs/stores';

import { useCurrencyConversionStore } from '@/features/currency/stores/currencyConversionStore';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { useHyperliquidBalance } from '@/features/perps/stores/derived/useHyperliquidBalance';
import { usePolymarketAccountValueSummary } from '@/features/polymarket/stores/derived/usePolymarketAccountValueSummary';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { add, greaterThan, multiply, subtract } from '@/helpers/utilities';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { deepEqual } from '@/worklets/comparisons';

export const liveBalancesSummary = createDerivedStore(
  $ => {
    const liveTokens = $(useLiveTokensStore, state => state.tokens);
    const initialBalance = $(useUserAssetsStore, state => state.getTotalBalance());
    const userAssets = $(useUserAssetsStore, state => state.userAssets);
    const isFetching = $(useUserAssetsStore, state => state.status === 'loading');
    const nativeCurrency = $(userAssetsStoreManager, state => state.currency);
    const address = $(useUserAssetsStore, state => state.address);
    const selectedAddress = $(useWalletsStore, state => state.accountAddress);
    const hasLoadedAssets = $(useUserAssetsStore, state => state.status === 'success');
    const hiddenAssetsBalance = $(useUserAssetsStore, state => state.hiddenAssetsBalance ?? '0');
    const hasCurrentClaimables = $(useClaimablesStore, state => state.getData() === (state.getCacheEntry()?.data ?? null));
    const hasCurrentPositions = $(usePositionsStore, state => state.getData() === (state.getCacheEntry()?.data ?? null));
    const hasCurrencyRate = $(useCurrencyConversionStore, state => !!state.getData());

    const perpsBalanceNative = $(useHyperliquidBalance);
    const claimablesBalance = $(useClaimablesStore, state => state.getBalance());
    const positionsBalance = $(usePositionsStore, state => state.getBalance());
    const polymarketAccountValue = $(usePolymarketAccountValueSummary, state => state.totalValueNative);

    let valueDifference = '0';
    if (liveTokens) {
      for (const [tokenId, token] of Object.entries(liveTokens)) {
        if (!token) continue;
        const userAsset = userAssets.get(tokenId);
        const canUseLivePrice = token.reliability.status === 'PRICE_RELIABILITY_STATUS_TRUSTED';

        if (userAsset && canUseLivePrice) {
          // override the asset’s price with the live token price
          let liveAssetBalance = multiply(token.price, userAsset.balance.amount);

          if (greaterThan(liveAssetBalance, token.reliability.metadata.liquidityCap)) {
            liveAssetBalance = token.reliability.metadata.liquidityCap;
          }

          const assetBalanceDifference = subtract(liveAssetBalance, userAsset.native.balance.amount);
          valueDifference = add(valueDifference, assetBalanceDifference);
        }
      }
    }

    const liveAssetBalance = initialBalance ? add(initialBalance, valueDifference) : '0';
    const otherBalances = add(add(add(positionsBalance, claimablesBalance), perpsBalanceNative), polymarketAccountValue);
    const totalBalanceAmount = add(liveAssetBalance, otherBalances);
    const isLoading = initialBalance === 0 && isFetching;

    return {
      address,
      currency: nativeCurrency,
      totalBalanceDisplay: isLoading ? null : convertAmountToNativeDisplay(totalBalanceAmount, nativeCurrency),
      // Previous query data can belong to another wallet or currency during a switch.
      cachedBalance:
        address && address === selectedAddress && hasLoadedAssets && hasCurrentClaimables && hasCurrentPositions && hasCurrencyRate
          ? {
              totalBalanceAmount,
              totalBalanceDisplay: convertAmountToNativeDisplay(totalBalanceAmount, nativeCurrency),
              balanceMinusHiddenDisplay: convertAmountToNativeDisplay(subtract(totalBalanceAmount, hiddenAssetsBalance), nativeCurrency),
            }
          : null,
    };
  },

  { debounce: 250, equalityFn: deepEqual, lockDependencies: true }
);

export const useLiveWalletBalance = createDerivedStore($ => $(liveBalancesSummary).totalBalanceDisplay);
