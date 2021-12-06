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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'editOptions' does not exist on type 'Def... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
    data => dispatch(rawSetHiddenCoins(data)),
    [dispatch]
  );

  const setIsCoinListEdited = useCallback(
    data => dispatch(rawSetIsCoinListEdited(data)),
    [dispatch]
  );

  const setPinnedCoins = useCallback(
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
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
