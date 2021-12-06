import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenFamilyTabs } from '../redux/openStateSettings';
import {
  addShowcaseToken as rawAddShowcaseToken,
  removeShowcaseToken as rawRemoveShowcaseToken,
} from '../redux/showcaseTokens';
import useWallets from './useWallets';
import useWebData from './useWebData';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const { updateWebShowcase } = useWebData();
  const { isReadOnlyWallet } = useWallets();

  const showcaseTokens = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'showcaseTokens' does not exist on type '... Remove this comment to see the full error message
    state => state.showcaseTokens.showcaseTokens
  );

  const addShowcaseToken = useCallback(
    async asset => {
      dispatch(rawAddShowcaseToken(asset));
      dispatch(setOpenFamilyTabs({ index: 'Showcase', state: true }));
      !isReadOnlyWallet && updateWebShowcase([...showcaseTokens, asset]);
    },
    [dispatch, isReadOnlyWallet, updateWebShowcase, showcaseTokens]
  );

  const removeShowcaseToken = useCallback(
    async asset => {
      dispatch(rawRemoveShowcaseToken(asset));
      !isReadOnlyWallet &&
        updateWebShowcase(showcaseTokens.filter((id: any) => id !== asset));
    },
    [dispatch, isReadOnlyWallet, showcaseTokens, updateWebShowcase]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  };
}
