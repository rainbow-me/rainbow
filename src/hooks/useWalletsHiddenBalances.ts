import { AllRainbowWallets } from '@/model/wallet';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { userAssetsStore } from '@/state/assets/userAssets';
import { queryClient } from '@/react-query';
import { userAssetsQueryKey, UserAssetsResult } from '@/resources/assets/UserAssetsQuery';
import { convertAmountAndPriceToNativeDisplay, add } from '@/helpers/utilities';
import { isEqual } from 'lodash';

export type WalletBalanceResult = {
  hiddenBalances: Record<Address, string>;
};

const getHiddenAssetBalance = ({
  address,
  nativeCurrency,
  connectedToHardhat,
}: {
  address: Address;
  nativeCurrency: NativeCurrencyKey;
  connectedToHardhat: boolean;
}) => {
  const { hiddenAssets } = userAssetsStore.getState(address);
  const assetData = queryClient.getQueryData<UserAssetsResult>(
    userAssetsQueryKey({ address, currency: nativeCurrency, connectedToHardhat })
  );

  return Array.from(hiddenAssets).reduce((acc, uniqueId) => {
    const asset = assetData?.[uniqueId];
    let sum = acc;
    if (asset) {
      const priceUnit = asset.price?.value ?? 0;
      const nativeDisplay = convertAmountAndPriceToNativeDisplay(asset?.balance?.amount ?? 0, priceUnit, nativeCurrency);
      sum = add(sum, nativeDisplay.amount);
    }
    return sum;
  }, '0');
};

const useWalletsHiddenBalances = (wallets: AllRainbowWallets): WalletBalanceResult => {
  const { nativeCurrency } = useAccountSettings();
  const connectedToHardhat = useConnectedToHardhatStore(state => state.connectedToHardhat);
  const [hiddenBalances, setHiddenBalances] = useState<Record<Address, string>>({});

  const allAddresses = useMemo(
    () => Object.values(wallets).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );

  const calculateHiddenBalanceForAddress = useCallback(
    (address: Address) => {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const hiddenAssetBalance = getHiddenAssetBalance({ address, nativeCurrency, connectedToHardhat });

      console.log('calculateHiddenBalanceForAddress', address, hiddenAssetBalance);
      setHiddenBalances(prev => ({
        ...prev,
        [lowerCaseAddress]: hiddenAssetBalance,
      }));
    },
    [nativeCurrency, connectedToHardhat]
  );

  useEffect(() => {
    allAddresses.forEach(calculateHiddenBalanceForAddress);
  }, [allAddresses, calculateHiddenBalanceForAddress]);

  // TODO: This is not working as intended. .subscribe() does not trigger when the value changes.
  useEffect(() => {
    console.log('Setting up subscriptions for addresses:', allAddresses);
    const subscriptions = allAddresses.map(address => {
      console.log('Setting up subscription for address:', address);
      return userAssetsStore.subscribe(
        state => {
          console.log('Current state for address:', address, state.hiddenAssets);
          return { hiddenAssets: state.hiddenAssets };
        },
        (newState, oldState) => {
          console.log('Checking for changes:', address, oldState, newState);
          if (!isEqual(oldState.hiddenAssets, newState.hiddenAssets)) {
            console.log('Detected change in user hidden assets for address:', address);
            calculateHiddenBalanceForAddress(address);
          }
        },
        {
          equalityFn: (a, b) => isEqual(a.hiddenAssets, b.hiddenAssets),
          fireImmediately: true,
        }
      );
    });

    return () => {
      console.log('Cleaning up subscriptions');
      subscriptions.forEach(sub => sub());
    };
  }, [allAddresses, calculateHiddenBalanceForAddress]);

  return {
    hiddenBalances,
  };
};

export default useWalletsHiddenBalances;
