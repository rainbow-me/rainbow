import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getAccountEmptyState,
  saveAccountEmptyState,
} from '../handlers/localstorage/accountLocal';
import useAccountSettings from './useAccountSettings';
import { AppState } from '@rainbow-me/redux/store';

export default function useAccountEmptyState(isSectionsEmpty: any) {
  const { network, accountAddress } = useAccountSettings();
  const isLoadingAssets = useSelector(
    (state: AppState) => state.data.isLoadingAssets
  );
  const isAccountEmptyInStorage = useMemo(
    () => getAccountEmptyState(accountAddress, network),
    [accountAddress, network]
  );
  // @ts-expect-error ts-migrate(7022) FIXME: 'isEmpty' implicitly has type 'any' because it doe... Remove this comment to see the full error message
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
