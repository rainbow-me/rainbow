import { AllRainbowWallets } from '@/model/wallet';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import useAccountSettings from './useAccountSettings';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { userAssetsStore } from '@/state/assets/userAssets';
import { queryClient } from '@/react-query';
import { userAssetsQueryKey, UserAssetsResult } from '@/resources/assets/UserAssetsQuery';
import { convertAmountAndPriceToNativeDisplay, add, isEqual } from '@/helpers/utilities';
import { isEqual as _isEqual } from 'lodash';

export type WalletBalanceResult = {
  hiddenBalances: Record<Address, string>;
};

const getHiddenAssetBalance = ({
  address,
  nativeCurrency,
  connectedToHardhat,
  data,
}: {
  address: Address;
  nativeCurrency: NativeCurrencyKey;
  connectedToHardhat: boolean;
  data?: UserAssetsResult;
}) => {
  const { hiddenAssets } = userAssetsStore.getState(address);
  const assetData =
    data ?? queryClient.getQueryData<UserAssetsResult>(userAssetsQueryKey({ address, currency: nativeCurrency, connectedToHardhat }));

  const balance = Array.from(hiddenAssets).reduce((acc, uniqueId) => {
    const asset = assetData?.[uniqueId];
    let sum = acc;
    if (asset) {
      const priceUnit = asset.price?.value ?? 0;
      const nativeDisplay = convertAmountAndPriceToNativeDisplay(asset?.balance?.amount ?? 0, priceUnit, nativeCurrency);
      sum = add(sum, nativeDisplay.amount);
    }
    return sum;
  }, '0');

  return balance;
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
    (address: Address, data?: UserAssetsResult) => {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const hiddenAssetBalance = getHiddenAssetBalance({ address, nativeCurrency, connectedToHardhat, data });

      setHiddenBalances(prev => {
        const newBalance = hiddenAssetBalance;
        if (!prev[lowerCaseAddress] || !isEqual(prev[lowerCaseAddress], newBalance)) {
          return {
            ...prev,
            [lowerCaseAddress]: newBalance,
          };
        }
        return prev;
      });
    },
    [nativeCurrency, connectedToHardhat]
  );

  useEffect(() => {
    allAddresses.forEach(address => {
      calculateHiddenBalanceForAddress(address);
    });
  }, [allAddresses, calculateHiddenBalanceForAddress]);

  useEffect(() => {
    const assetSubscriptions = allAddresses.map(address => {
      return queryClient.getQueryCache().subscribe(event => {
        if (
          _isEqual(event.query.queryKey, userAssetsQueryKey({ address, currency: nativeCurrency, connectedToHardhat })) &&
          event.query.isStale()
        ) {
          calculateHiddenBalanceForAddress(address, event.query.state.data);
        }
      });
    });

    const subscriptions = allAddresses.map(address => {
      return userAssetsStore.subscribe(
        state => state,
        (newState, oldState) => {
          if (!_isEqual(oldState.hiddenAssets, newState.hiddenAssets)) {
            calculateHiddenBalanceForAddress(address);
          }
        },
        {
          equalityFn: (a, b) => _isEqual(a.hiddenAssets, b.hiddenAssets),
          fireImmediately: true,
        },
        address
      );
    });

    return () => {
      subscriptions.forEach(sub => sub());
      assetSubscriptions.forEach(sub => sub());
    };
  }, [allAddresses, calculateHiddenBalanceForAddress, connectedToHardhat, nativeCurrency]);

  return { hiddenBalances };
};

export default useWalletsHiddenBalances;
