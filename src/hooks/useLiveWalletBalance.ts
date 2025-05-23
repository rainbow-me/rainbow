import { useEffect, useMemo, useState } from 'react';
import useAccountSettings from './useAccountSettings';
import { add, convertAmountToNativeDisplay, multiply, subtract } from '@/helpers/utilities';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { usePositionsStore } from '@/state/positions/positions';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

export type WalletBalance = {
  assetBalanceAmount: string;
  assetBalanceDisplay: string;
  positionsBalanceAmount: string;
  positionsBalanceDisplay: string;
  totalBalanceAmount: string;
  totalBalanceDisplay: string;
};

/**
 * Hook to fetch balances for a single wallet
 * @param address - The address to fetch balances for
 * @returns Balances for the wallet
 */
export const useLiveWalletBalance = (address: string) => {
  const { nativeCurrency } = useAccountSettings();
  const [liveAssetBalance, setLiveAssetBalance] = useState('0');

  const initialBalance = useUserAssetsStore(state => state.getTotalBalance());
  const userAssets = useUserAssetsStore(state => state.userAssets);
  const liveTokens = useLiveTokensStore(state => state.tokens);
  const isLoading = initialBalance === undefined;

  useEffect(() => {
    if (!initialBalance) return;
    let valueDifference = '0';
    if (liveTokens) {
      for (const [tokenId, token] of Object.entries(liveTokens)) {
        const userAsset = userAssets.get(tokenId);
        if (userAsset) {
          // override the token price with the live token price
          const liveAssetBalance = multiply(token.price, userAsset.balance.amount);
          const assetBalanceDifference = subtract(liveAssetBalance, userAsset.native.balance.amount);
          valueDifference = add(valueDifference, assetBalanceDifference);
        }
      }
    }
    const newLiveAssetBalance = add(initialBalance, valueDifference);
    if (newLiveAssetBalance !== liveAssetBalance) {
      setLiveAssetBalance(newLiveAssetBalance);
    }
  }, [liveTokens, userAssets, initialBalance, liveAssetBalance]);

  // The positions & claimables tokens do not use the live token store in the UI yet, so we do not override their individual prices.
  const positionsBalance = usePositionsStore(
    state =>
      state.getData({
        address: address,
        currency: nativeCurrency,
      })?.totals.total.amount || '0'
  );
  const claimablesBalance = useClaimablesStore(
    state =>
      state.getData({
        address: address,
        currency: nativeCurrency,
      })?.totalValueAmount || '0'
  );

  const balances = useMemo(() => {
    const totalAccountBalance = add(liveAssetBalance, add(positionsBalance, claimablesBalance));
    return {
      assetsBalance: {
        amount: liveAssetBalance,
        display: convertAmountToNativeDisplay(liveAssetBalance, nativeCurrency),
      },
      positionsBalance: {
        amount: positionsBalance,
        display: convertAmountToNativeDisplay(positionsBalance, nativeCurrency),
      },
      claimablesBalance: {
        amount: claimablesBalance,
        display: convertAmountToNativeDisplay(claimablesBalance, nativeCurrency),
      },
      totalBalance: {
        amount: totalAccountBalance,
        display: convertAmountToNativeDisplay(totalAccountBalance, nativeCurrency),
      },
    };
  }, [nativeCurrency, liveAssetBalance, positionsBalance, claimablesBalance]);

  return {
    balances,
    isLoading,
  };
};
