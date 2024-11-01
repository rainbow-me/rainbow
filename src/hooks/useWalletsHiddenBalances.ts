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
}: {
  address: Address;
  nativeCurrency: NativeCurrencyKey;
  connectedToHardhat: boolean;
}) => {
  const hiddenAssetIds = userAssetsStore.getState(address).getHiddenAssetsIds();
  const assetData = queryClient.getQueryData<UserAssetsResult>(
    userAssetsQueryKey({ address, currency: nativeCurrency, connectedToHardhat })
  );

  const balance = hiddenAssetIds.reduce((acc, uniqueId) => {
    const asset = assetData?.[uniqueId];
    if (!asset) return acc
    const assetNativeBalance = multiply(asset.price?.value || 0, asset.balance?.amount || 0)
    return add(acc, assetNativeBalance);
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
    (address: Address) => {
      const lowerCaseAddress = address.toLowerCase() as Address;
      const hiddenAssetBalance = getHiddenAssetBalance({ address, nativeCurrency, connectedToHardhat });

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
    const unsubscribeFromQueryCache = queryClient.getQueryCache().subscribe(event => {
      const [args, key] = event.query.queryKey;
      if (key === 'userAssets') {
        calculateHiddenBalanceForAddress(args.address);
      }
    });

    const subscriptions = allAddresses.map(address => {
      return userAssetsStore.subscribe(
        state => state,
        () => calculateHiddenBalanceForAddress(address),
        {
          equalityFn: (a, b) => _isEqual(a.hiddenAssets, b.hiddenAssets),
          fireImmediately: true,
        },
        address
      );
    });

    return () => {
      subscriptions.forEach(sub => sub());
      unsubscribeFromQueryCache();
    };
  }, [allAddresses, calculateHiddenBalanceForAddress, connectedToHardhat, nativeCurrency]);

  return { hiddenBalances };
};

export default useWalletsHiddenBalances;
