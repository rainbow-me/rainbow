import { add, convertAmountToNativeDisplay, greaterThan, multiply, subtract } from '@/helpers/utilities';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { usePositionsStore } from '@/state/positions/positions';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual, deepEqual } from '@/worklets/comparisons';
import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';

export const useLiveWalletBalance = createDerivedStore(
  $ => {
    const liveTokens = $(useLiveTokensStore, state => state.tokens);
    const initialBalance = $(useUserAssetsStore, state => state.getTotalBalance());
    const userAssets = $(useUserAssetsStore, state => state.userAssets);
    const isFetching = $(useUserAssetsStore, state => state.status === 'loading');
    const params = $(userAssetsStoreManager, state => ({ address: state.address, currency: state.currency }), shallowEqual);
    const usdToNativeCurrencyConversionRate = $(
      useCurrencyConversionStore,
      state => state.getData({ toCurrency: params.currency })?.usdToNativeCurrencyConversionRate || 1
    );
    const claimablesBalance = $(useClaimablesStore, state => state.getData(params)?.totalValueAmount || '0');
    const positionsBalance = $(usePositionsStore, state => {
      const data = state.getData(params);
      if (!data) return '0';
      return subtract(data.totals.total.amount, data.totals.totalLocked);
    });
    const perpsBalanceUsd = $(useHyperliquidAccountStore, state => state.value);
    const perpsBalanceNative = multiply(perpsBalanceUsd, usdToNativeCurrencyConversionRate);

    let valueDifference = '0';
    if (liveTokens) {
      for (const [tokenId, token] of Object.entries(liveTokens)) {
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
    const otherBalances = add(add(positionsBalance, claimablesBalance), perpsBalanceNative);
    const totalBalanceAmount = add(liveAssetBalance, otherBalances);
    const isLoading = initialBalance === 0 && isFetching;

    return isLoading ? null : convertAmountToNativeDisplay(totalBalanceAmount, params.currency);
  },

  { debounce: 250, equalityFn: deepEqual }
);
