import { difference } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';
import EditAction from '@/helpers/EditAction';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useCoinListEditStore, setSelectedItems as setSelectedItemsAction } from '@/state/coinListEdit/coinListEdit';

export interface BooleanMap {
  [index: string]: boolean;
}

const INITIAL_PINNED_COINS: BooleanMap = {};

export default function useCoinListEditOptions() {
  const { accountAddress } = useAccountSettings();

  const [pinnedCoins = INITIAL_PINNED_COINS, setPinnedCoinsObject] = useMMKVObject<BooleanMap>('pinned-coins-obj-' + accountAddress);

  const addPinnedCoin = useCallback(
    (uniqueId: string) => {
      setPinnedCoinsObject((prev: BooleanMap | undefined) => {
        return {
          ...(prev ?? {}),
          [uniqueId.toLowerCase()]: true,
        };
      });
    },
    [setPinnedCoinsObject]
  );

  const removePinnedCoin = useCallback(
    (uniqueId: string) => {
      setPinnedCoinsObject((prev: BooleanMap | undefined) => {
        const newPinnedCoins = { ...(prev ?? {}) };
        delete newPinnedCoins[uniqueId.toLowerCase()];
        return newPinnedCoins;
      });
    },
    [setPinnedCoinsObject]
  );

  const pushSelectedCoin = useCallback(
    (item: string) =>
      setSelectedItemsAction(prev => {
        return prev.filter(i => i !== item).concat(item);
      }),
    []
  );

  const removeSelectedCoin = useCallback((item: string) => setSelectedItemsAction(prev => prev.filter(i => i !== item)), []);

  const toggleSelectedCoin = useCallback(
    (item: string) =>
      setSelectedItemsAction(prev => {
        if (prev.includes(item)) {
          return prev.filter(i => i !== item);
        } else {
          return prev.concat(item);
        }
      }),
    []
  );

  const clearSelectedCoins = useCallback(() => setSelectedItemsAction([]), []);

  return {
    addPinnedCoin,
    removePinnedCoin,
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

  const selectedItems = useCoinListEditStore(state => state.selectedItems);
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
    setSelectedItemsAction([]);
  }, [setPinnedCoinsObject]);

  const setHiddenCoins = useCallback(() => {
    if (
      !currentActionNonReactive.current ||
      currentActionNonReactive.current === EditAction.none ||
      currentActionNonReactive.current === EditAction.unpin
    )
      return;

    setHiddenAssets([...(selectedItemsNonReactive.current || [])]);

    setSelectedItemsAction([]);
  }, [setHiddenAssets]);

  return {
    currentAction,
    selectedItems,
    setHiddenCoins,
    setPinnedCoins,
  };
}
