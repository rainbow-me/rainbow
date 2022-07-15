import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addHiddenToken as rawAddHiddenToken,
  removeHiddenToken as rawRemoveHiddenToken,
} from '../redux/hiddenTokens';
import useOpenFamilies from './useOpenFamilies';
import useWallets from './useWallets';
import useWebData from './useWebData';

export default function useHiddenTokens() {
  const dispatch = useDispatch();
  const { updateWebHidden } = useWebData();
  const { isReadOnlyWallet } = useWallets();
  const { updateOpenFamilies } = useOpenFamilies();

  const hiddenTokens: string[] = useSelector(
    // @ts-expect-error
    state => state.hiddenTokens.hiddenTokens
  );

  const addHiddenToken = useCallback(
    async asset => {
      dispatch(rawAddHiddenToken(asset));
      !isReadOnlyWallet && updateWebHidden([...hiddenTokens, asset]);
    },
    [
      dispatch,
      isReadOnlyWallet,
      hiddenTokens,
      updateOpenFamilies,
      updateWebHidden,
    ]
  );

  const removeHiddenToken = useCallback(
    async asset => {
      dispatch(rawRemoveHiddenToken(asset));
      !isReadOnlyWallet &&
        updateWebHidden(hiddenTokens.filter(id => id !== asset));
    },
    [dispatch, isReadOnlyWallet, hiddenTokens, updateWebHidden]
  );

  return {
    addHiddenToken,
    hiddenTokens,
    removeHiddenToken,
  };
}
