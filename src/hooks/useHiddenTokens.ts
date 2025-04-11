import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { analytics } from '@/analytics';
import { UniqueAsset } from '@/entities';
import { addHiddenToken as rawAddHiddenToken, removeHiddenToken as rawRemoveHiddenToken } from '../redux/hiddenTokens';
import { useWalletsStore } from '../redux/wallets';
import useWebData from './useWebData';

export default function useHiddenTokens() {
  const dispatch = useDispatch();
  const { updateWebHidden } = useWebData();
  const isReadOnlyWallet = useWalletsStore(state => state.getIsReadOnlyWallet());

  const hiddenTokens: string[] = useSelector(
    // @ts-expect-error
    state => state.hiddenTokens.hiddenTokens
  );

  const addHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawAddHiddenToken(asset.fullUniqueId));
      !isReadOnlyWallet && updateWebHidden([...hiddenTokens, asset.fullUniqueId]);

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.asset_contract.address || null,
        collectionName: asset.collection.name,
        isHidden: true,
      });
    },
    [dispatch, isReadOnlyWallet, hiddenTokens, updateWebHidden]
  );

  const removeHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawRemoveHiddenToken(asset.fullUniqueId));
      !isReadOnlyWallet && updateWebHidden(hiddenTokens.filter(id => id !== asset.fullUniqueId));

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.asset_contract.address || null,
        collectionName: asset.collection.name,
        isHidden: false,
      });
    },
    [dispatch, isReadOnlyWallet, hiddenTokens, updateWebHidden]
  );

  return {
    addHiddenToken,
    hiddenTokens,
    removeHiddenToken,
  };
}
