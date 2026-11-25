import { createDerivedStore } from '@storesjs/stores';

import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { useHyperliquidBalance } from '@/features/perps/stores/derived/useHyperliquidBalance';
import { usePolymarketAccountValueSummary } from '@/features/polymarket/stores/derived/usePolymarketAccountValueSummary';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { useWalletAssetsStore } from '@/features/wallet/data/walletAssetsStore';
import { add, greaterThan, multiply, subtract } from '@/helpers/utilities';
import type { UserAssetsState } from '@/state/assets/types';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import type { LiveTokensData } from '@/state/liveTokens/types';
import { isTrustedLiveToken } from '@/state/liveTokens/utils';

export const useLiveWalletBalance = createDerivedStore(
  $ => {
    const liveTokens = $(useLiveTokensStore, s => s.tokens);
    const initialBalance = $(useWalletAssetsStore, s => s.balance);
    const userAssets = $(useWalletAssetsStore, s => s.assets);
    const isInitialLoad = $(useUserAssetsStore, s => s.isInitialLoad());
    const hiddenAssets = $(useUserAssetsStore, s => s.hiddenAssets);
    const nativeCurrency = $(useAppSettingsStore, s => s.currency);

    const perpsBalanceNative = $(useHyperliquidBalance);
    const claimablesBalance = $(useClaimablesStore, s => s.getBalance());
    const positionsBalance = $(usePositionsStore, s => s.getBalance());
    const polymarketAccountValue = $(usePolymarketAccountValueSummary, s => s.totalValueNative);

    if (!initialBalance && isInitialLoad) return null;

    const liveAssetBalance = initialBalance ? add(initialBalance, calculateDifference(liveTokens, userAssets, hiddenAssets)) : '0';
    const otherBalances = add(add(add(positionsBalance, claimablesBalance), perpsBalanceNative), polymarketAccountValue);
    const totalBalanceAmount = add(liveAssetBalance, otherBalances);

    return convertAmountToNativeDisplay(totalBalanceAmount, nativeCurrency);
  },

  { debounce: 250, lockDependencies: true }
);

function calculateDifference(
  liveTokens: LiveTokensData,
  userAssets: UserAssetsState['userAssets'],
  hiddenAssets: UserAssetsState['hiddenAssets']
): string {
  let valueDifference = '0';

  for (const tokenId in liveTokens) {
    const asset = userAssets.get(tokenId);
    if (!asset || hiddenAssets.has(tokenId)) continue;

    const token = liveTokens[tokenId];
    if (!isTrustedLiveToken(token)) continue;

    const liquidityCap = token.reliability.metadata.liquidityCap;
    let liveBalance = multiply(token.price, asset.balance.amount);
    if (greaterThan(liveBalance, liquidityCap)) liveBalance = liquidityCap;

    valueDifference = add(valueDifference, subtract(liveBalance, asset.native.balance.amount));
  }

  return valueDifference;
}
