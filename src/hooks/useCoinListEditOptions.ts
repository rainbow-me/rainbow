import { difference } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import useAccountSettings from './useAccountSettings';
import EditAction from '@/helpers/EditAction';
import { useUserAssetsStore } from '@/state/assets/userAssets';

const selectedItemsAtom = atom<string[]>({
  default: [],
  key: 'selectedItemsAtom',
});

export interface BooleanMap {
  [index: string]: boolean;
}

const INITIAL_PINNED_COINS: BooleanMap = {};

export default function useCoinListEditOptions() {
  const { accountAddress } = useAccountSettings();

  const setSelectedItems = useSetRecoilState(selectedItemsAtom);

  const [pinnedCoins = INITIAL_PINNED_COINS] = useMMKVObject<BooleanMap>('pinned-coins-obj-' + accountAddress);
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
    pinnedCoinsObj: pinnedCoins,
    pushSelectedCoin,
    removeSelectedCoin,
    toggleSelectedCoin,
  };
}

export function useCoinListFinishEditingOptions() {
  const { accountAddress } = useAccountSettings();
  const hiddenAssets = useUserAssetsStore(state => state.getHiddenAssetsIds());
  const setHiddenAssets = useUserAssetsStore(state => state.setHiddenAssets);

  const [selectedItems, setSelectedItems] = useRecoilState(selectedItemsAtom);
  const selectedItemsNonReactive = useRef<string[]>();
  selectedItemsNonReactive.current = selectedItems;

  const [pinnedCoins = {}, setPinnedCoinsObject] = useMMKVObject<BooleanMap>('pinned-coins-obj-' + accountAddress);

  const currentAction = useMemo(() => {
    const newSelectedCoinsLength = selectedItems.length;

    if (newSelectedCoinsLength === 0) {
      return EditAction.none;
    } else if (
      newSelectedCoinsLength > 0 &&
      difference(hiddenAssets, selectedItems).length === hiddenAssets.length - newSelectedCoinsLength
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
  }, [hiddenAssets, pinnedCoins, selectedItems]);

  const currentActionNonReactive = useRef<keyof typeof EditAction>();
  currentActionNonReactive.current = currentAction;

  const setPinnedCoins = useCallback(() => {
    setPinnedCoinsObject((pinnedCoins: BooleanMap | undefined) => {
      const safePinnedCoins = pinnedCoins ?? {};
      if (currentActionNonReactive.current === EditAction.unpin) {
        return Object.keys(safePinnedCoins).reduce((acc, curr) => {
          if (!selectedItemsNonReactive.current?.includes(curr)) {
            acc[curr] = true;
          }
          return acc;
        }, {} as BooleanMap);
      } else {
        return [
          ...Object.keys(safePinnedCoins),
          ...(currentActionNonReactive.current === EditAction.standard ? selectedItemsNonReactive.current || [] : []),
        ].reduce((acc, curr) => {
          acc[curr] = true;
          return acc;
        }, {} as BooleanMap);
      }
    });
    setSelectedItems([]);
  }, [setSelectedItems, setPinnedCoinsObject]);

  const setHiddenCoins = useCallback(() => {
    if (
      !currentActionNonReactive.current ||
      currentActionNonReactive.current === EditAction.none ||
      currentActionNonReactive.current === EditAction.unpin
    )
      return;

    setHiddenAssets([...(selectedItemsNonReactive.current || [])]);

    setSelectedItems([]);
  }, [setHiddenAssets, setSelectedItems]);

  return {
    currentAction,
    selectedItems,
    setHiddenCoins,
    setPinnedCoins,
  };
}
