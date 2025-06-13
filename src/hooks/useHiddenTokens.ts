import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { analytics } from '@/analytics';
import { UniqueAsset } from '@/entities';
import { addHiddenToken as rawAddHiddenToken, removeHiddenToken as rawRemoveHiddenToken } from '../redux/hiddenTokens';
<<<<<<< HEAD
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
=======
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
>>>>>>> origin/develop
import useWebData from './useWebData';

export default function useHiddenTokens() {
  const dispatch = useDispatch();
  const { updateWebHidden } = useWebData();
<<<<<<< HEAD
=======
  const isReadOnlyWallet = useIsReadOnlyWallet();
>>>>>>> origin/develop

  const hiddenTokens: string[] = useSelector(
    // @ts-expect-error
    state => state.hiddenTokens.hiddenTokens
  );

  const addHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawAddHiddenToken(asset.fullUniqueId));
      const isReadOnlyWallet = getIsReadOnlyWallet();
      !isReadOnlyWallet && updateWebHidden([...hiddenTokens, asset.fullUniqueId]);

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.asset_contract.address || null,
        collectionName: asset.collection.name,
        isHidden: true,
      });
    },
    [dispatch, hiddenTokens, updateWebHidden]
  );

  const removeHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawRemoveHiddenToken(asset.fullUniqueId));
      const isReadOnlyWallet = getIsReadOnlyWallet();
      !isReadOnlyWallet && updateWebHidden(hiddenTokens.filter(id => id !== asset.fullUniqueId));

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.asset_contract.address || null,
        collectionName: asset.collection.name,
        isHidden: false,
      });
    },
    [dispatch, hiddenTokens, updateWebHidden]
  );

  return {
    addHiddenToken,
    hiddenTokens,
    removeHiddenToken,
  };
}
