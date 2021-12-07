import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addShowcaseToken as rawAddShowcaseToken,
  removeShowcaseToken as rawRemoveShowcaseToken,
} from '../redux/showcaseTokens';
import useOpenFamilies from './useOpenFamilies';
import useWallets from './useWallets';
import useWebData from './useWebData';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const { updateWebShowcase } = useWebData();
  const { isReadOnlyWallet } = useWallets();
  const { updateOpenFamilies } = useOpenFamilies();

  const showcaseTokens = useSelector(
    state => state.showcaseTokens.showcaseTokens
  );

  const addShowcaseToken = useCallback(
    async asset => {
      dispatch(rawAddShowcaseToken(asset));
      updateOpenFamilies({ 'Showcase-showcase': true });
      !isReadOnlyWallet && updateWebShowcase([...showcaseTokens, asset]);
    },
    [
      dispatch,
      updateOpenFamilies,
      isReadOnlyWallet,
      updateWebShowcase,
      showcaseTokens,
    ]
  );

  const removeShowcaseToken = useCallback(
    async asset => {
      dispatch(rawRemoveShowcaseToken(asset));
      !isReadOnlyWallet &&
        updateWebShowcase(showcaseTokens.filter(id => id !== asset));
    },
    [dispatch, isReadOnlyWallet, showcaseTokens, updateWebShowcase]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  };
}
