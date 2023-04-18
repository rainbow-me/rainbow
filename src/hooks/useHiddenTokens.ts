import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  addHiddenToken as rawAddHiddenToken,
  removeHiddenToken as rawRemoveHiddenToken,
} from '../redux/hiddenTokens';
import useWallets from './useWallets';
import useWebData from './useWebData';
import { analytics } from '@/analytics';
import { NFT } from '@/resources/nfts/types';

export default function useHiddenTokens() {
  const dispatch = useDispatch();
  const { updateWebHidden } = useWebData();
  const { isReadOnlyWallet } = useWallets();

  const hiddenTokens: string[] = useSelector(
    // @ts-expect-error
    state => state.hiddenTokens.hiddenTokens
  );

  const addHiddenToken = useCallback(
    async (asset: NFT) => {
      dispatch(rawAddHiddenToken(asset.uniqueId));
      !isReadOnlyWallet && updateWebHidden([...hiddenTokens, asset.uniqueId]);

      analytics.track('Toggled an NFT as Hidden', {
        collectionContractAddress: asset.asset_contract.address || null,
        collectionName: asset.collection.name,
        isHidden: true,
      });
    },
    [dispatch, isReadOnlyWallet, hiddenTokens, updateWebHidden]
  );

  const removeHiddenToken = useCallback(
    async (asset: NFT) => {
      dispatch(rawRemoveHiddenToken(asset.uniqueId));
      !isReadOnlyWallet &&
        updateWebHidden(hiddenTokens.filter(id => id !== asset.uniqueId));

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
