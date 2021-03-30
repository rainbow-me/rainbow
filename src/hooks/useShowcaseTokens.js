import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PreferenceActionType, setPreference } from '../model/preferences';
import { loadWallet } from '../model/wallet';
import { setOpenFamilyTabs } from '../redux/openStateSettings';
import {
  addShowcaseToken as rawAddShowcaseToken,
  removeShowcaseToken as rawRemoveShowcaseToken,
} from '../redux/showcaseTokens';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const showcaseTokens = useSelector(
    state => state.showcaseTokens.showcaseTokens
  );

  const addShowcaseToken = useCallback(
    async asset => {
      dispatch(rawAddShowcaseToken(asset));
      dispatch(setOpenFamilyTabs({ index: 'Showcase', state: true }));
      const [, id] = asset.split('_');
      const wallet = await loadWallet();
      setPreference(PreferenceActionType.add, 'showcase', id, wallet);
    },
    [dispatch]
  );

  const removeShowcaseToken = useCallback(
    async asset => {
      dispatch(rawRemoveShowcaseToken(asset));
      const [, id] = asset.split('_');
      const wallet = await loadWallet();
      setPreference(PreferenceActionType.remove, 'showcase', id, wallet);
    },
    [dispatch]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  };
}
