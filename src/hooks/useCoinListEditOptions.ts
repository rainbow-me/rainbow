import { atom, useAtom } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';
import { difference } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { useDispatch } from 'react-redux';
import actions from '@rainbow-me/helpers/editOptionTypes';
import { setHiddenCoins as reduxSetHiddenCoins } from '@rainbow-me/redux/editOptions';

const selectedItemsAtom = atom<string[]>([]);
export default function useCoinListEditOptions() {
  const setSelectedItems = useUpdateAtom(selectedItemsAtom);
  const [hiddenCoins = []] = useMMKVObject<string[]>('hidden-coins');

  const [pinnedCoins = []] = useMMKVObject<string[]>('pinned-coins');
  const pushSelectedCoin = useCallback(
    (item: string) =>
      setSelectedItems(prev => [...prev.filter(i => i !== item), item]),
    [setSelectedItems]
  );

  const removeSelectedCoin = useCallback(
    (item: string) =>
      setSelectedItems(prev => [...prev.filter(i => i !== item)]),
    [setSelectedItems]
  );

  const toggleSelectedCoin = useCallback(
    (item: string) =>
      setSelectedItems(prev => {
        if (prev.includes(item)) {
          return [...prev.filter(i => i !== item)];
        } else {
          return [...prev, item];
        }
      }),
    [setSelectedItems]
  );

  const clearSelectedCoins = useCallback(() => setSelectedItems([]), [
    setSelectedItems,
  ]);

  return {
    clearSelectedCoins,
    hiddenCoins,
    pinnedCoins,
    pushSelectedCoin,
    removeSelectedCoin,
    toggleSelectedCoin,
  };
}

export function useCoinListFinishEditingOptions() {
  const [selectedItems, setSelectedItems] = useAtom(selectedItemsAtom);
  const [hiddenCoins = [], setHiddenCoinsArray] = useMMKVObject<string[]>(
    'hidden-coins'
  );

  const [pinnedCoins = [], setPinnedCoinsArray] = useMMKVObject<string[]>(
    'pinned-coins'
  );

  const currentAction = useMemo(() => {
    const newSelectedCoinsLength = selectedItems.length;

    if (newSelectedCoinsLength === 0) {
      return actions.none;
    } else if (
      newSelectedCoinsLength > 0 &&
      difference(hiddenCoins, selectedItems).length ===
        hiddenCoins.length - newSelectedCoinsLength
    ) {
      return actions.unhide;
    } else if (
      newSelectedCoinsLength > 0 &&
      difference(pinnedCoins, selectedItems).length ===
        pinnedCoins.length - newSelectedCoinsLength
    ) {
      return actions.unpin;
    } else {
      return actions.standard;
    }
  }, [hiddenCoins, pinnedCoins, selectedItems]);

  const setPinnedCoins = useCallback(() => {
    setPinnedCoinsArray([
      ...pinnedCoins.filter(i => !selectedItems.includes(i)),
      ...(currentAction === actions.standard ? selectedItems : []),
    ]);
    setSelectedItems([]);
  }, [
    setSelectedItems,
    currentAction,
    pinnedCoins,
    selectedItems,
    setPinnedCoinsArray,
  ]);

  const dispatch = useDispatch();

  const setHiddenCoins = useCallback(() => {
    const newList = [
      ...hiddenCoins.filter(i => !selectedItems.includes(i)),
      ...(currentAction === actions.standard ? selectedItems : []),
    ];
    setHiddenCoinsArray(newList);
    dispatch(reduxSetHiddenCoins(newList));

    setSelectedItems([]);
  }, [
    dispatch,
    setSelectedItems,
    currentAction,
    hiddenCoins,
    selectedItems,
    setHiddenCoinsArray,
  ]);

  return {
    currentAction,
    selectedItems,
    setHiddenCoins,
    setPinnedCoins,
  };
}
