import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getAccountEmptyState,
  saveAccountEmptyState,
} from '../handlers/localstorage/accountLocal';
import useAccountSettings from './useAccountSettings';
import useWalletSectionsData from './useWalletSectionsData';

export default function useAccountEmptyState() {
  const { network, accountAddress } = useAccountSettings();
  const { isEmpty: isSectionsEmpty } = useWalletSectionsData();
  const isLoadingAssets = useSelector(state => state.data.isLoadingAssets);
  const isAccountEmptyInStorage = useMemo(
    () => getAccountEmptyState(accountAddress, network),
    [accountAddress, network]
  );
  const isEmpty = useMemo(
    () => ({
      ...isEmpty,
      [accountAddress]: isLoadingAssets
        ? isAccountEmptyInStorage
        : isSectionsEmpty,
    }),
    [accountAddress, isAccountEmptyInStorage, isLoadingAssets, isSectionsEmpty]
  );

  useEffect(() => {
    if (!isLoadingAssets) {
      saveAccountEmptyState(false, accountAddress, network);
    }
  }, [accountAddress, isLoadingAssets, isSectionsEmpty, network]);

  return {
    isEmpty: isEmpty[accountAddress],
  };
}
