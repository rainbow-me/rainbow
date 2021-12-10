import { difference } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import useAccountSettings from './useAccountSettings';
import actions from '@rainbow-me/helpers/editOptionTypes';

const selectedItemsAtom = atom<string[]>({
  default: [],
  key: 'selectedItemsAtom',
});

export default function useCoinListEditOptions() {
  const { accountAddress: address } = useAccountSettings();

  const setSelectedItems = useSetRecoilState(selectedItemsAtom);
  const [hiddenCoins = []] = useMMKVObject<string[]>('hidden-coins-' + address);

  const [pinnedCoins = []] = useMMKVObject<string[]>('pinned-coins-' + address);
  const pushSelectedCoin = useCallback(
    (item: string) =>
      setSelectedItems(prev => {
        return [...prev.filter(i => i !== item), item];
      }),
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
  const { accountAddress: address } = useAccountSettings();

  const [selectedItems, setSelectedItems] = useRecoilState(selectedItemsAtom);
  const selectedItemsNonReactive = useRef<string[]>();
  selectedItemsNonReactive.current = selectedItems;

  const [hiddenCoins = [], setHiddenCoinsArray] = useMMKVObject<string[]>(
    'hidden-coins-' + address
  );

  const [pinnedCoins = [], setPinnedCoinsArray] = useMMKVObject<string[]>(
    'pinned-coins-' + address
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

  const currentActionNonReactive = useRef<actions>();
  currentActionNonReactive.current = currentAction;

  const setPinnedCoins = useCallback(() => {
    setPinnedCoinsArray((pinnedCoins: string[]) => {
      return [
        ...pinnedCoins.filter(
          i => !selectedItemsNonReactive.current!.includes(i)
        ),
        ...(currentActionNonReactive.current === actions.standard
          ? selectedItemsNonReactive.current!
          : []),
      ];
    });
    setSelectedItems([]);
  }, [setSelectedItems, setPinnedCoinsArray]);

  const setHiddenCoins = useCallback(() => {
    setHiddenCoinsArray(hiddenCoins => {
      return [
        ...hiddenCoins.filter(
          i => !selectedItemsNonReactive.current!.includes(i)
        ),
        ...(currentActionNonReactive.current === actions.standard
          ? selectedItemsNonReactive.current!
          : []),
      ];
    });

    setSelectedItems([]);
  }, [setSelectedItems, setHiddenCoinsArray]);

  return {
    currentAction,
    selectedItems,
    setHiddenCoins,
    setPinnedCoins,
  };
}
