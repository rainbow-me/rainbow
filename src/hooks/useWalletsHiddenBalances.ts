import { AllRainbowWallets } from '@/model/wallet';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Address } from 'viem';
import { userAssetsStore } from '@/state/assets/userAssets';
import { queryClient } from '@/react-query';
import { add, isEqual, multiply } from '@/helpers/utilities';
import { isEqual as _isEqual } from 'lodash';

export type WalletBalanceResult = {
  hiddenBalances: Record<Address, string>;
};

const getHiddenAssetBalance = ({ address }: { address: Address }) => {
  const hiddenAssetIds = userAssetsStore.getState(address).getHiddenAssetsIds();

  const balance = hiddenAssetIds.reduce((acc, uniqueId) => {
    const asset = userAssetsStore.getState(address).getUserAsset(uniqueId);
    if (!asset) return acc;
    const assetNativeBalance = multiply(asset.price?.value || 0, asset.balance?.amount || 0);
    return add(acc, assetNativeBalance);
  }, '0');

  return balance;
};

const useWalletsHiddenBalances = (wallets: AllRainbowWallets): WalletBalanceResult => {
  const [hiddenBalances, setHiddenBalances] = useState<Record<Address, string>>({});

  const allAddresses = useMemo(
    () => Object.values(wallets).flatMap(wallet => (wallet.addresses || []).map(account => account.address as Address)),
    [wallets]
  );

  const calculateHiddenBalanceForAddress = useCallback((address: Address) => {
    const lowerCaseAddress = address.toLowerCase() as Address;
    const hiddenAssetBalance = getHiddenAssetBalance({ address });

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
  }, []);

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
  }, [allAddresses, calculateHiddenBalanceForAddress]);

  return { hiddenBalances };
};

export default useWalletsHiddenBalances;
