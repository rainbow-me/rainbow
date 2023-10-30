import { useEffect, useMemo } from 'react';
import {
  getAccountEmptyState,
  saveAccountEmptyState,
} from '../handlers/localstorage/accountLocal';
import useAccountSettings from './useAccountSettings';

export default function useAccountEmptyState(
  isSectionsEmpty: boolean,
  isLoadingUserAssets: boolean
) {
  const { network, accountAddress } = useAccountSettings();
  const isAccountEmptyInStorage = useMemo(
    () => getAccountEmptyState(accountAddress, network),
    [accountAddress, network]
  );
  const isEmpty: { [address: string]: boolean | undefined } = useMemo(
    () => ({
      ...isEmpty,
      [accountAddress]: isLoadingUserAssets
        ? isAccountEmptyInStorage
        : isSectionsEmpty,
    }),
    [
      accountAddress,
      isAccountEmptyInStorage,
      isLoadingUserAssets,
      isSectionsEmpty,
    ]
  );

  useEffect(() => {
    if (!isLoadingUserAssets) {
      saveAccountEmptyState(false, accountAddress, network);
    }
  }, [accountAddress, isLoadingUserAssets, isSectionsEmpty, network]);

  return {
    isEmpty: isEmpty[accountAddress],
  };
}
