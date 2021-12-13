import { difference } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { useDispatch } from 'react-redux';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import useAccountSettings from './useAccountSettings';
import EditAction from '@rainbow-me/helpers/EditAction';
import { setHiddenCoins as reduxSetHiddenCoins } from '@rainbow-me/redux/editOptions';

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
      return EditAction.none;
    } else if (
      newSelectedCoinsLength > 0 &&
      difference(hiddenCoins, selectedItems).length ===
        hiddenCoins.length - newSelectedCoinsLength
    ) {
      return EditAction.unhide;
    } else if (
      newSelectedCoinsLength > 0 &&
      difference(pinnedCoins, selectedItems).length ===
        pinnedCoins.length - newSelectedCoinsLength
    ) {
      return EditAction.unpin;
    } else {
      return EditAction.standard;
    }
  }, [hiddenCoins, pinnedCoins, selectedItems]);

  const currentActionNonReactive = useRef<keyof typeof EditAction>();
  currentActionNonReactive.current = currentAction;

  const setPinnedCoins = useCallback(() => {
    setPinnedCoinsArray((pinnedCoins: string[]) => {
      return [
        ...pinnedCoins.filter(
          i => !selectedItemsNonReactive.current!.includes(i)
        ),
        ...(currentActionNonReactive.current === EditAction.standard
          ? selectedItemsNonReactive.current!
          : []),
      ];
    });
    setSelectedItems([]);
  }, [setSelectedItems, setPinnedCoinsArray]);

  const dispatch = useDispatch();

  const setHiddenCoins = useCallback(() => {
    setHiddenCoinsArray(hiddenCoins => {
      const newList = [
        ...hiddenCoins.filter(
          i => !selectedItemsNonReactive.current!.includes(i)
        ),
        ...(currentActionNonReactive.current === EditAction.standard
          ? selectedItemsNonReactive.current!
          : []),
      ];
      dispatch(reduxSetHiddenCoins(newList));
      return newList;
    });

    setSelectedItems([]);
  }, [dispatch, setSelectedItems, setHiddenCoinsArray]);

  return {
    currentAction,
    selectedItems,
    setHiddenCoins,
    setPinnedCoins,
  };
}
