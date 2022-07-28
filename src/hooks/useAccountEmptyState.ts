import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getAccountEmptyState,
  saveAccountEmptyState,
} from '../handlers/localstorage/accountLocal';
import useAccountSettings from './useAccountSettings';
import { AppState } from '@rainbow-me/redux/store';

export default function useAccountEmptyState(isSectionsEmpty: boolean) {
  const { network, accountAddress } = useAccountSettings();
  const isLoadingAssets = useSelector(
    (state: AppState) => state.data.isLoadingAssets
  );
  const isAccountEmptyInStorage = useMemo(
    () => getAccountEmptyState(accountAddress, network),
    [accountAddress, network]
  );
  const isEmpty: { [address: string]: boolean | undefined } = useMemo(
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
