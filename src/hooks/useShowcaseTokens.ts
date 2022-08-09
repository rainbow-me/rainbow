import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addShowcaseToken as rawAddShowcaseToken,
  removeShowcaseToken as rawRemoveShowcaseToken,
} from '../redux/showcaseTokens';
import { AppState } from '../redux/store';
import useAccountSettings from './useAccountSettings';
import useFetchShowcaseTokens from './useFetchShowcaseTokens';
import useOpenFamilies from './useOpenFamilies';
import useWallets from './useWallets';
import useWebData from './useWebData';

export default function useShowcaseTokens() {
  const dispatch = useDispatch();
  const { updateWebShowcase } = useWebData();
  const { isReadOnlyWallet } = useWallets();
  const { updateOpenFamilies } = useOpenFamilies();
  const { accountAddress } = useAccountSettings();

  const localShowcaseTokens = useSelector(
    (state: AppState) => state.showcaseTokens.showcaseTokens
  );

  // If it's not a read-only wallet, we can pass an empty object to
  // `useFetchShowcaseTokens` to prevent the fetch. We wouldn't need to fetch
  // here because `showcaseTokens` would already be populated (with web data
  // if necessary) by `showcaseTokensLoadState` earlier.
  const showcaseTokensQuery = useFetchShowcaseTokens(
    isReadOnlyWallet ? { address: accountAddress } : {}
  );

  const showcaseTokens = isReadOnlyWallet
    ? showcaseTokensQuery.data ?? []
    : localShowcaseTokens;

  const addShowcaseToken = useCallback(
    async asset => {
      dispatch(rawAddShowcaseToken(asset));
      updateOpenFamilies({ Showcase: true });
      !isReadOnlyWallet && updateWebShowcase([...localShowcaseTokens, asset]);
    },
    [
      dispatch,
      isReadOnlyWallet,
      localShowcaseTokens,
      updateOpenFamilies,
      updateWebShowcase,
    ]
  );

  const removeShowcaseToken = useCallback(
    async asset => {
      dispatch(rawRemoveShowcaseToken(asset));
      !isReadOnlyWallet &&
        updateWebShowcase(
          localShowcaseTokens.filter((id: any) => id !== asset)
        );
    },
    [dispatch, isReadOnlyWallet, localShowcaseTokens, updateWebShowcase]
  );

  return {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  };
}
