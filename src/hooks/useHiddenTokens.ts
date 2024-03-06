import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { addHiddenToken as rawAddHiddenToken, removeHiddenToken as rawRemoveHiddenToken } from '../redux/hiddenTokens';
import useWallets from './useWallets';
import useWebData from './useWebData';
import { analytics } from '@/analytics';
import { UniqueAsset } from '@/entities';

export default function useHiddenTokens() {
  const dispatch = useDispatch();
  const { updateWebHidden } = useWebData();
  const { isReadOnlyWallet } = useWallets();

  const hiddenTokens: string[] = useSelector(
    // @ts-expect-error
    state => state.hiddenTokens.hiddenTokens
  );

  const addHiddenToken = useCallback(
    async (asset: UniqueAsset) => {
      dispatch(rawAddHiddenToken(asset.fullUniqueId));
      !isReadOnlyWallet && updateWebHidden([...hiddenTokens, asset.fullUniqueId]);

      analytics.track('Toggled an NFT as Hidden', {
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

      analytics.track('Toggled an NFT as Hidden', {
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
