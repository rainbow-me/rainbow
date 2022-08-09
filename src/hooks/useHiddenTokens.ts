import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  addHiddenToken as rawAddHiddenToken,
  removeHiddenToken as rawRemoveHiddenToken,
} from '../redux/hiddenTokens';
import { AppState } from '../redux/store';
import useAccountSettings from './useAccountSettings';
import useFetchHiddenTokens from './useFetchHiddenTokens';
import useWallets from './useWallets';
import useWebData from './useWebData';
import { analytics } from '@rainbow-me/analytics';
import { UniqueAsset } from '@rainbow-me/entities';

export default function useHiddenTokens() {
  const dispatch = useDispatch();
  const { updateWebHidden } = useWebData();
  const { isReadOnlyWallet } = useWallets();
  const { accountAddress } = useAccountSettings();

  const localHiddenTokens: string[] = useSelector(
    (state: AppState) => state.hiddenTokens.hiddenTokens
  );

  // If it's not a read-only wallet, we can pass an empty object to
  // `useFetchHiddenTokens` to prevent the fetch. We wouldn't need to fetch
  // here because `hiddenTokens` would already be populated (with web data
  // if necessary) by `hiddenTokensLoadState` earlier.
  const hiddenTokensQuery = useFetchHiddenTokens(
    isReadOnlyWallet ? { address: accountAddress } : {}
  );

  const hiddenTokens = isReadOnlyWallet
    ? hiddenTokensQuery.data ?? []
    : localHiddenTokens;

  const addHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawAddHiddenToken(asset.fullUniqueId));
      !isReadOnlyWallet &&
        updateWebHidden([...localHiddenTokens, asset.fullUniqueId]);

      analytics.track('Toggled an NFT as Hidden', {
        collectionContractAddress: asset.asset_contract.address || null,
        collectionName: asset.collection.name,
        isHidden: true,
      });
    },
    [dispatch, isReadOnlyWallet, localHiddenTokens, updateWebHidden]
  );

  const removeHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawRemoveHiddenToken(asset.fullUniqueId));
      !isReadOnlyWallet &&
        updateWebHidden(
          localHiddenTokens.filter(id => id !== asset.fullUniqueId)
        );

      analytics.track('Toggled an NFT as Hidden', {
        collectionContractAddress: asset.asset_contract.address || null,
        collectionName: asset.collection.name,
        isHidden: false,
      });
    },
    [dispatch, isReadOnlyWallet, localHiddenTokens, updateWebHidden]
  );

  return {
    addHiddenToken,
    hiddenTokens,
    removeHiddenToken,
  };
}
