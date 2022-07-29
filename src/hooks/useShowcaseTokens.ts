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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'showcaseTokens' does not exist on type '... Remove this comment to see the full error message
    state => state.showcaseTokens.showcaseTokens
  );

  const addShowcaseToken = useCallback(
    async asset => {
      dispatch(rawAddShowcaseToken(asset));
      updateOpenFamilies({ Showcase: true });
      !isReadOnlyWallet && updateWebShowcase([...showcaseTokens, asset]);
    },
    [
      dispatch,
      isReadOnlyWallet,
      showcaseTokens,
      updateOpenFamilies,
      updateWebShowcase,
    ]
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
