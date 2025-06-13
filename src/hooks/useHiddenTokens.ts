import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { analytics } from '@/analytics';
import { UniqueAsset } from '@/entities';
import { addHiddenToken as rawAddHiddenToken, removeHiddenToken as rawRemoveHiddenToken } from '../redux/hiddenTokens';
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import useWebData from './useWebData';

export default function useHiddenTokens() {
  const dispatch = useDispatch();
  const { updateWebHidden } = useWebData();
  const isReadOnlyWallet = useIsReadOnlyWallet();

  const hiddenTokens: string[] = useSelector(
    // @ts-expect-error
    state => state.hiddenTokens.hiddenTokens
  );

  const addHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawAddHiddenToken(asset.uniqueId.toLowerCase()));
      !isReadOnlyWallet && updateWebHidden([...hiddenTokens, asset.uniqueId.toLowerCase()]);

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.contractAddress,
        collectionName: asset.collectionName,
        isHidden: true,
      });
    },
    [dispatch, isReadOnlyWallet, hiddenTokens, updateWebHidden]
  );

  const removeHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawRemoveHiddenToken(asset.uniqueId.toLowerCase()));
      !isReadOnlyWallet && updateWebHidden(hiddenTokens.filter(id => id !== asset.uniqueId.toLowerCase()));

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.contractAddress,
        collectionName: asset.collectionName,
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
