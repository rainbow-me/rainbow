import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearSelectedCoins as rawClearSelectedCoins,
  pushSelectedCoin as rawPushSelectedCoin,
  removeSelectedCoin as rawRemoveSelectedCoin,
  setHiddenCoins as rawSetHiddenCoins,
  setIsCoinListEdited as rawSetIsCoinListEdited,
  setPinnedCoins as rawSetPinnedCoins,
} from '../redux/editOptions';

export default function useCoinListEditOptions() {
  const dispatch = useDispatch();

  const editData = useSelector(
    ({
      editOptions: {
        currentAction,
        hiddenCoins,
        isCoinListEdited,
        pinnedCoins,
      },
    }) => ({
      currentAction,
      hiddenCoins,
      isCoinListEdited,
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

  const setIsCoinListEdited = useCallback(
    data => dispatch(rawSetIsCoinListEdited(data)),
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
    setIsCoinListEdited,
    setPinnedCoins,
    ...editData,
  };
}
