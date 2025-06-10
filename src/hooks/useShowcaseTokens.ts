import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addShowcaseToken as rawAddShowcaseToken, removeShowcaseToken as rawRemoveShowcaseToken } from '../redux/showcaseTokens';
import useOpenFamilies from './useOpenFamilies';
import useWallets from './useWallets';
import useWebData from './useWebData';
import { AppState } from '@/redux/store';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const { updateWebShowcase } = useWebData();
  const { isReadOnlyWallet } = useWallets();
  const { updateOpenFamilies } = useOpenFamilies();

  const showcaseTokens = useSelector((state: AppState) => state.showcaseTokens.showcaseTokens);

  const addShowcaseToken = useCallback(
    async (asset: string) => {
      dispatch(rawAddShowcaseToken(asset));
      updateOpenFamilies({ Showcase: true });
      !isReadOnlyWallet && updateWebShowcase([...showcaseTokens, asset]);
    },
    [dispatch, isReadOnlyWallet, showcaseTokens, updateOpenFamilies, updateWebShowcase]
  );

  const removeShowcaseToken = useCallback(
    async (asset: string) => {
      dispatch(rawRemoveShowcaseToken(asset));
      !isReadOnlyWallet && updateWebShowcase(showcaseTokens.filter((id: string) => id !== asset));
    },
    [dispatch, isReadOnlyWallet, showcaseTokens, updateWebShowcase]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  };
}
