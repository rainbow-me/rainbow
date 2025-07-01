import { AppState } from '@/redux/store';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addShowcaseToken as rawAddShowcaseToken, removeShowcaseToken as rawRemoveShowcaseToken } from '../redux/showcaseTokens';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import useOpenFamilies from './useOpenFamilies';
import useWebData from './useWebData';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const { updateWebShowcase } = useWebData();
  const { updateOpenFamilies } = useOpenFamilies();

  const showcaseTokens = useSelector((state: AppState) => state.showcaseTokens.showcaseTokens);

  const addShowcaseToken = useCallback(
    async (asset: string) => {
      dispatch(rawAddShowcaseToken(asset));
      updateOpenFamilies({ Showcase: true });
      !getIsReadOnlyWallet() && updateWebShowcase([...showcaseTokens, asset]);
    },
    [dispatch, showcaseTokens, updateOpenFamilies, updateWebShowcase]
  );

  const removeShowcaseToken = useCallback(
    async (asset: string) => {
      dispatch(rawRemoveShowcaseToken(asset));
      !getIsReadOnlyWallet() && updateWebShowcase(showcaseTokens.filter((id: string) => id !== asset));
    },
    [dispatch, showcaseTokens, updateWebShowcase]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  };
}
