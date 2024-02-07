import { difference } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { useDispatch } from 'react-redux';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import useAccountSettings from './useAccountSettings';
import EditAction from '@/helpers/EditAction';
import { setHiddenCoins as reduxSetHiddenCoins } from '@/redux/editOptions';

const selectedItemsAtom = atom<string[]>({
  default: [],
  key: 'selectedItemsAtom',
});

export interface BooleanMap {
  [index: string]: boolean;
}

export default function useCoinListEditOptions() {
  const { accountAddress } = useAccountSettings();

  const setSelectedItems = useSetRecoilState(selectedItemsAtom);
  const [hiddenCoins = {}] = useMMKVObject<BooleanMap>('hidden-coins-obj-' + accountAddress);

  const [pinnedCoins = {}] = useMMKVObject<BooleanMap>('pinned-coins-obj-' + accountAddress);
  const pushSelectedCoin = useCallback(
    (item: string) =>
      setSelectedItems(prev => {
        return prev.filter(i => i !== item).concat(item);
      }),
    [setSelectedItems]
  );

  const removeSelectedCoin = useCallback((item: string) => setSelectedItems(prev => prev.filter(i => i !== item)), [setSelectedItems]);

  const toggleSelectedCoin = useCallback(
    (item: string) =>
      setSelectedItems(prev => {
        if (prev.includes(item)) {
          return prev.filter(i => i !== item);
        } else {
          return prev.concat(item);
        }
      }),
    [setSelectedItems]
  );

  const clearSelectedCoins = useCallback(() => setSelectedItems([]), [setSelectedItems]);

  return {
    clearSelectedCoins,
    hiddenCoinsObj: hiddenCoins,
    pinnedCoinsObj: pinnedCoins,
    pushSelectedCoin,
    removeSelectedCoin,
    toggleSelectedCoin,
  };
}

export function useCoinListFinishEditingOptions() {
  const { accountAddress } = useAccountSettings();

  const [selectedItems, setSelectedItems] = useRecoilState(selectedItemsAtom);
  const selectedItemsNonReactive = useRef<string[]>();
  selectedItemsNonReactive.current = selectedItems;

  const [hiddenCoins = {}, setHiddenCoinsObject] = useMMKVObject<BooleanMap>('hidden-coins-obj-' + accountAddress);

  const [pinnedCoins = {}, setPinnedCoinsObject] = useMMKVObject<BooleanMap>('pinned-coins-obj-' + accountAddress);

  const currentAction = useMemo(() => {
    const newSelectedCoinsLength = selectedItems.length;

    if (newSelectedCoinsLength === 0) {
      return EditAction.none;
    } else if (
      newSelectedCoinsLength > 0 &&
      difference(Object.keys(hiddenCoins), selectedItems).length === Object.keys(hiddenCoins).length - newSelectedCoinsLength
    ) {
      return EditAction.unhide;
    } else if (
      newSelectedCoinsLength > 0 &&
      difference(Object.keys(pinnedCoins), selectedItems).length === Object.keys(pinnedCoins).length - newSelectedCoinsLength
    ) {
      return EditAction.unpin;
    } else {
      return EditAction.standard;
    }
  }, [hiddenCoins, pinnedCoins, selectedItems]);

  const currentActionNonReactive = useRef<keyof typeof EditAction>();
  currentActionNonReactive.current = currentAction;

  const setPinnedCoins = useCallback(() => {
    setPinnedCoinsObject((pinnedCoins: BooleanMap) => {
      return [
        ...Object.keys(pinnedCoins ?? []).filter(i => !selectedItemsNonReactive.current!.includes(i)),
        ...(currentActionNonReactive.current === EditAction.standard ? selectedItemsNonReactive.current! : []),
      ].reduce((acc, curr) => {
        acc[curr] = true;
        return acc;
      }, {} as BooleanMap);
    });
    setSelectedItems([]);
  }, [setSelectedItems, setPinnedCoinsObject]);

  const dispatch = useDispatch();

  const setHiddenCoins = useCallback(() => {
    setHiddenCoinsObject((hiddenCoins: BooleanMap) => {
      const newList = [
        ...Object.keys(hiddenCoins ?? []).filter(i => !selectedItemsNonReactive.current!.includes(i)),
        ...(currentActionNonReactive.current === EditAction.standard ? selectedItemsNonReactive.current! : []),
      ].reduce((acc, curr) => {
        acc[curr] = true;
        return acc;
      }, {} as BooleanMap);
      dispatch(reduxSetHiddenCoins(newList));
      return newList;
    });

    setSelectedItems([]);
  }, [dispatch, setSelectedItems, setHiddenCoinsObject]);

  return {
    currentAction,
    selectedItems,
    setHiddenCoins,
    setPinnedCoins,
  };
}
