import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearSelectedCoins as rawClearSelectedCoins,
  pushSelectedCoin as rawPushSelectedCoin,
  removeSelectedCoin as rawRemoveSelectedCoin,
  setHiddenCoins as rawSetHiddenCoins,
  setPinnedCoins as rawSetPinnedCoins,
} from '../redux/editOptions';

export default function useCoinListEditOptions() {
  const dispatch = useDispatch();

  const editData = useSelector(
    ({ editOptions: { currentAction, hiddenCoins, pinnedCoins } }) => ({
      currentAction,
      hiddenCoins,
      pinnedCoins,
    })
  );

  const clearSelectedCoins = useCallback(
    () => dispatch(rawClearSelectedCoins()),
    [dispatch]
  );

  const pushSelectedCoin = useCallback(
    data => dispatch(rawPushSelectedCoin(data)),
    [dispatch]
  );

  const removeSelectedCoin = useCallback(
    data => dispatch(rawRemoveSelectedCoin(data)),
    [dispatch]
  );

  const setHiddenCoins = useCallback(
    data => dispatch(rawSetHiddenCoins(data)),
    [dispatch]
  );

  const setPinnedCoins = useCallback(
    data => dispatch(rawSetPinnedCoins(data)),
    [dispatch]
  );

  return {
    clearSelectedCoins,
    pushSelectedCoin,
    removeSelectedCoin,
    setHiddenCoins,
    setPinnedCoins,
    ...editData,
  };
}
