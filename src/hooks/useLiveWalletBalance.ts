import { add, convertAmountToNativeDisplay, multiply, subtract } from '@/helpers/utilities';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { usePositionsStore } from '@/state/positions/positions';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual, deepEqual } from '@/worklets/comparisons';

export const useLiveWalletBalance = createDerivedStore(
  $ => {
    const liveTokens = $(useLiveTokensStore, state => state.tokens);
    const initialBalance = $(useUserAssetsStore, state => state.getTotalBalance());
    const userAssets = $(useUserAssetsStore, state => state.userAssets);
    const isFetching = $(useUserAssetsStore, state => state.status === 'loading');

    const params = $(userAssetsStoreManager, state => ({ address: state.address, currency: state.currency }), shallowEqual);
    const claimablesBalance = $(useClaimablesStore, state => state.getData(params)?.totalValueAmount || '0');
    const positionsBalance = $(usePositionsStore, state => state.getData(params)?.totals.total.amount || '0');

    let valueDifference = '0';
    if (liveTokens) {
      for (const [tokenId, token] of Object.entries(liveTokens)) {
        const userAsset = userAssets.get(tokenId);
        const canUseLivePrice = token.reliability.status === 'PRICE_RELIABILITY_STATUS_TRUSTED';

        if (userAsset && canUseLivePrice) {
          // override the asset’s price with the live token price
          const liveAssetBalance = multiply(token.price, userAsset.balance.amount);
          const assetBalanceDifference = subtract(liveAssetBalance, userAsset.native.balance.amount);
          valueDifference = add(valueDifference, assetBalanceDifference);
        }
      }
    }

    const liveAssetBalance = initialBalance ? add(initialBalance, valueDifference) : '0';
    const totalBalanceAmount = add(liveAssetBalance, add(positionsBalance, claimablesBalance));

    const balances = {
      assetsBalance: {
        amount: liveAssetBalance,
        display: convertAmountToNativeDisplay(liveAssetBalance, params.currency),
      },
      positionsBalance: {
        amount: positionsBalance,
        display: convertAmountToNativeDisplay(positionsBalance, params.currency),
      },
      claimablesBalance: {
        amount: claimablesBalance,
        display: convertAmountToNativeDisplay(claimablesBalance, params.currency),
      },
      totalBalance: {
        amount: totalBalanceAmount,
        display: convertAmountToNativeDisplay(totalBalanceAmount, params.currency),
      },
    };

    const isLoading = initialBalance === 0 && isFetching;

    return { balances, isLoading };
  },

  { debounce: 250, equalityFn: deepEqual }
);
