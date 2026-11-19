import { createDerivedStore } from '@storesjs/stores';

import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { useHyperliquidBalance } from '@/features/perps/stores/derived/useHyperliquidBalance';
import { usePolymarketAccountValueSummary } from '@/features/polymarket/stores/derived/usePolymarketAccountValueSummary';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useWalletAssetsStore } from '@/features/wallet/data/walletAssetsStore';
import { add, greaterThan, multiply, subtract } from '@/helpers/utilities';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

export const useLiveWalletBalance = createDerivedStore(
  $ => {
    const liveTokens = $(useLiveTokensStore, state => state.tokens);
    const initialBalance = $(useWalletAssetsStore, state => state.balance);
    const userAssets = $(useWalletAssetsStore, state => state.assets);
    const isInitialLoad = $(useUserAssetsStore, state => state.isInitialLoad());
    const hiddenAssets = $(useUserAssetsStore, state => state.hiddenAssets);
    const nativeCurrency = $(userAssetsStoreManager, state => state.currency);

    const perpsBalanceNative = $(useHyperliquidBalance);
    const claimablesBalance = $(useClaimablesStore, state => state.getBalance());
    const positionsBalance = $(usePositionsStore, state => state.getBalance());
    const polymarketAccountValue = $(usePolymarketAccountValueSummary, state => state.totalValueNative);

    if (!initialBalance && isInitialLoad) return null;

    let valueDifference = '0';
    if (liveTokens) {
      for (const [tokenId, token] of Object.entries(liveTokens)) {
        if (!token || hiddenAssets.has(tokenId)) continue;
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
    return convertAmountToNativeDisplay(totalBalanceAmount, nativeCurrency);
  },

  { debounce: 250, lockDependencies: true }
);
