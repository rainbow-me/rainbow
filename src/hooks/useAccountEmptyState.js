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
  const { isEmpty } = useWalletSectionsData();
  const isLoadingAssets = useSelector(state => state.data.isLoadingAssets);
  const isReallyEmpty = useMemo(
    () => getAccountEmptyState(accountAddress, network),
    [accountAddress, network]
  );

  useEffect(() => {
    if (!isLoadingAssets) {
      saveAccountEmptyState(isEmpty, accountAddress, network);
    }
  }, [accountAddress, isEmpty, isLoadingAssets, network]);

  return {
    isEmpty: isReallyEmpty || isEmpty,
  };
}
