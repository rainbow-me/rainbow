import React, { createContext, useCallback, useContext } from 'react';
import Animated, { AnimatedRef, makeMutable, runOnJS, SharedValue, useAnimatedRef, useDerivedValue } from 'react-native-reanimated';
import { noop } from 'lodash';

import { UniqueId } from '@/__swaps__/types/assets';
import { useUserAssetsStore } from '@/state/assets/userAssets';

export enum EditAction {
  none = 'NONE',
  pin = 'PIN',
  unpin = 'UNPIN',
  hide = 'HIDE',
  unhide = 'UNHIDE',
}

type SectionIds = 'top-assets' | 'divider' | 'bottom-assets';

interface AssetListItem {
  type: 'asset';
  uniqueId: UniqueId;
  sectionId: SectionIds;
}

interface DividerListItem {
  type: 'divider';
  sectionId: SectionIds;
}

export type UserAssetListItem = AssetListItem | DividerListItem;

type UserAssetsListActions = {
  toggleSelectedAsset: (uniqueId: UniqueId) => void;
  toggleExpanded: () => void;
  toggleEditing: () => void;
  finishEditing: (action: EditAction) => void;
};

type UserAssetsListContextType = {
  flatlistRef: AnimatedRef<Animated.FlatList<number>> | undefined;
  selectedAssets: SharedValue<Array<UniqueId>>;
  isExpanded: SharedValue<boolean>;
  isEditing: SharedValue<boolean>;
  currentAction: SharedValue<EditAction>;
  hiddenAssets: SharedValue<Record<UniqueId, boolean>>;
  pinnedAssets: SharedValue<Record<UniqueId, boolean>>;
} & UserAssetsListActions;

export const UserAssetsListContext = createContext<UserAssetsListContextType>({
  flatlistRef: undefined,
  selectedAssets: makeMutable<Array<UniqueId>>([]),
  isExpanded: makeMutable<boolean>(false),
  isEditing: makeMutable<boolean>(false),
  currentAction: makeMutable<EditAction>(EditAction.none),
  hiddenAssets: makeMutable<Record<UniqueId, boolean>>({}),
  pinnedAssets: makeMutable<Record<UniqueId, boolean>>({}),
  toggleSelectedAsset: noop,
  toggleExpanded: noop,
  toggleEditing: noop,
  finishEditing: noop,
});

export function useUserAssetsListContext() {
  return useContext(UserAssetsListContext);
}

export const MAX_CONDENSED_ASSETS = 6;
export const DIVIDER_HEIGHT = 48;

export function UserAssetsListProvider({ children }: { children: React.ReactNode }) {
  const flatlistRef = useAnimatedRef<Animated.FlatList<number>>();
  const selectedAssets = makeMutable<Array<UniqueId>>([]);
  const isExpanded = makeMutable<boolean>(false);
  const isEditing = makeMutable<boolean>(false);

  const setPinnedAssets = useUserAssetsStore(state => state.setPinnedAssets);
  const setHiddenAssets = useUserAssetsStore(state => state.setHiddenAssets);

  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssetsSharedvalue);
  const pinnedAssets = useUserAssetsStore(state => state.pinnedAssetsSharedvalue);

  const toggleSelectedAsset = useCallback(
    (uniqueId: UniqueId) => {
      'worklet';

      selectedAssets.modify(set => {
        if (set.includes(uniqueId)) {
          set.splice(set.indexOf(uniqueId), 1);
        } else {
          set.push(uniqueId);
        }
        return set;
      });
    },
    [selectedAssets]
  );

  const toggleExpanded = useCallback(() => {
    'worklet';
    isExpanded.value = !isExpanded.value;
  }, [isExpanded]);

  const toggleEditing = useCallback(() => {
    'worklet';
    isEditing.value = !isEditing.value;
  }, [isEditing]);

  const currentAction = useDerivedValue(() => {
    if (selectedAssets.value.length === 0) return EditAction.none;

    // if every selected asset is hidden, return unhide
    const allSelectedAssetIds = Array.from(selectedAssets.value);
    const allSelectedAssetsHidden = allSelectedAssetIds.every(id => hiddenAssets.value[id]);

    if (allSelectedAssetIds.length > 0 && allSelectedAssetsHidden) {
      return EditAction.unhide;
    }

    // if every selected asset is pinned, return unpin
    const allSelectedAssetsPinned = allSelectedAssetIds.every(id => pinnedAssets.value[id]);
    if (allSelectedAssetIds.length > 0 && allSelectedAssetsPinned) {
      return EditAction.unpin;
    }

    // if no assets are pinned, return pin
    const anySelectedAssetsPinned = allSelectedAssetIds.some(id => pinnedAssets.value[id]);
    if (!anySelectedAssetsPinned) {
      return EditAction.pin;
    }

    // if no assets are hidden, return hide
    const anySelectedAssetsHidden = allSelectedAssetIds.some(id => hiddenAssets.value[id]);
    if (!anySelectedAssetsHidden) {
      return EditAction.hide;
    }

    return EditAction.none;
  });

  const unhideAssets = useCallback(
    (ids: string[]) => {
      'worklet';
      hiddenAssets.modify(map => {
        ids.forEach(id => delete map[id]);
        return map;
      });
    },
    [hiddenAssets]
  );

  const unpinAssets = useCallback(
    (ids: string[]) => {
      'worklet';
      pinnedAssets.modify(map => {
        ids.forEach(id => delete map[id]);
        return map;
      });
    },
    [pinnedAssets]
  );

  const finishEditing = useCallback(
    (action: EditAction) => {
      'worklet';

      const selectedIds = Array.from(selectedAssets.value);

      switch (action) {
        case EditAction.pin: {
          pinnedAssets.modify(map => {
            const newMap: Record<UniqueId, boolean> = { ...map };
            selectedIds.forEach(id => (newMap[id] = true));
            return newMap as typeof map;
          });
          unhideAssets(selectedIds);
          runOnJS(setPinnedAssets)(selectedIds, action);
          break;
        }
        case EditAction.unpin: {
          pinnedAssets.modify(map => {
            const newMap: Record<UniqueId, boolean> = { ...map };
            selectedIds.forEach(id => delete newMap[id]);
            return newMap as typeof map;
          });
          runOnJS(setPinnedAssets)(selectedIds, action);
          break;
        }
        case EditAction.hide: {
          hiddenAssets.modify(map => {
            const newMap: Record<UniqueId, boolean> = { ...map };
            selectedIds.forEach(id => (newMap[id] = true));
            return newMap as typeof map;
          });
          unpinAssets(selectedIds);
          runOnJS(setHiddenAssets)(selectedIds, action);
          break;
        }
        case EditAction.unhide: {
          hiddenAssets.modify(map => {
            const newMap: Record<UniqueId, boolean> = { ...map };
            selectedIds.forEach(id => delete newMap[id]);
            return newMap as typeof map;
          });
          runOnJS(setHiddenAssets)(selectedIds, action);
          break;
        }
        case EditAction.none:
          break;
      }

      // Clear selected assets after any action
      selectedAssets.value = [];
    },
    [hiddenAssets, pinnedAssets, selectedAssets, setHiddenAssets, setPinnedAssets, unhideAssets, unpinAssets]
  );

  return (
    <UserAssetsListContext.Provider
      value={{
        selectedAssets,
        isExpanded,
        isEditing,
        flatlistRef,
        toggleExpanded,
        toggleEditing,
        toggleSelectedAsset,
        currentAction,
        hiddenAssets,
        pinnedAssets,
        finishEditing,
      }}
    >
      {children}
    </UserAssetsListContext.Provider>
  );
}
