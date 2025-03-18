import React, { createContext, useCallback, useContext, useEffect } from 'react';
import Animated, {
  AnimatedRef,
  makeMutable,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useDerivedValue,
} from 'react-native-reanimated';
import { noop } from 'lodash';

import { UniqueId, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { userAssetsStore, useUserAssetsStore } from '@/state/assets/userAssets';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useAccountSettings } from '@/hooks';
import { MMKV } from 'react-native-mmkv';
import { BooleanMap } from '@/hooks/useCoinListEditOptions';

const mmkv = new MMKV();

export enum EditAction {
  none = 'NONE',
  standard = 'STANDARD',
  pin = 'PIN',
  unpin = 'UNPIN',
  hide = 'HIDE',
  unhide = 'UNHIDE',
}

type SectionIds = 'top-assets' | 'divider' | 'bottom-assets';

interface AssetListItem {
  type: 'asset';
  asset: ParsedSearchAsset;
  sectionId: SectionIds;
}

interface DividerListItem {
  type: 'divider';
  sectionId: SectionIds;
}

export type UserAssetListItem = AssetListItem | DividerListItem;

type UserAssetsListActions = {
  toggleSelectedAsset: (asset: ParsedSearchAsset) => void;
  toggleExpanded: () => void;
  toggleEditing: () => void;
  finishEditing: (action: EditAction) => void;
};

type UserAssetsListContextType = {
  flatlistRef: AnimatedRef<Animated.FlatList<number>> | undefined;
  selectedAssets: SharedValue<Array<UniqueId>>;
  sections: SharedValue<UserAssetListItem[]>;
  isExpanded: SharedValue<boolean>;
  isEditing: SharedValue<boolean>;
  currentAction: SharedValue<EditAction>;
  hiddenAssets: SharedValue<Array<UniqueId>>;
  pinnedAssets: SharedValue<Array<UniqueId>>;
} & UserAssetsListActions;

export const UserAssetsListContext = createContext<UserAssetsListContextType>({
  flatlistRef: undefined,
  selectedAssets: makeMutable<Array<UniqueId>>([]),
  sections: makeMutable<UserAssetListItem[]>([]),
  isExpanded: makeMutable<boolean>(false),
  isEditing: makeMutable<boolean>(false),
  currentAction: makeMutable<EditAction>(EditAction.none),
  hiddenAssets: makeMutable<Array<UniqueId>>([]),
  pinnedAssets: makeMutable<Array<UniqueId>>([]),
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

type WalletAssetsStore = {
  currentAccountAddress: string;
  totalAssets: number;
  setTotalAssets: (totalAssets: number) => void;
};

export const walletAssetsStore = createRainbowStore<WalletAssetsStore>(set => ({
  currentAccountAddress: userAssetsStore.getState().address,
  totalAssets: userAssetsStore.getState().getUserAssetsWithPinnedFirstAndHiddenAssetsLast().length
    ? Math.min(userAssetsStore.getState().getUserAssetsWithPinnedFirstAndHiddenAssetsLast().length, MAX_CONDENSED_ASSETS + 1)
    : 0,
  setTotalAssets: (totalAssets: number) => set({ totalAssets }),
}));

export function UserAssetsListProvider({ children }: { children: React.ReactNode }) {
  const flatlistRef = useAnimatedRef<Animated.FlatList<number>>();
  const selectedAssets = makeMutable<Array<UniqueId>>([]);
  const sections = makeMutable<UserAssetListItem[]>(
    buildSections(userAssetsStore.getState().getUserAssetsWithPinnedFirstAndHiddenAssetsLast(), false)
  );
  const isExpanded = makeMutable<boolean>(false);
  const isEditing = makeMutable<boolean>(false);

  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssetsSharedvalue);
  const pinnedAssets = useUserAssetsStore(state => state.pinnedAssetsSharedvalue);

  const toggleSelectedAsset = useCallback(
    (asset: ParsedSearchAsset) => {
      'worklet';
      if (!asset) return;

      selectedAssets.modify(set => {
        if (set.includes(asset.uniqueId)) {
          set.splice(set.indexOf(asset.uniqueId), 1);
        } else {
          set.push(asset.uniqueId);
        }
        return set;
      });
    },
    [sections, selectedAssets]
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
    const allSelectedAssetsHidden = allSelectedAssetIds.every(id => hiddenAssets.value.includes(id));

    if (allSelectedAssetIds.length > 0 && allSelectedAssetsHidden) {
      return EditAction.unhide;
    }

    // if every selected asset is pinned, return unpin
    const allSelectedAssetsPinned = allSelectedAssetIds.every(id => pinnedAssets.value.includes(id));
    if (allSelectedAssetIds.length > 0 && allSelectedAssetsPinned) {
      return EditAction.unpin;
    }

    // if no assets are pinned, return pin
    const anySelectedAssetsPinned = allSelectedAssetIds.some(id => pinnedAssets.value.includes(id));
    if (!anySelectedAssetsPinned) {
      return EditAction.pin;
    }

    // if no assets are hidden, return hide
    const anySelectedAssetsHidden = allSelectedAssetIds.some(id => hiddenAssets.value.includes(id));
    if (!anySelectedAssetsHidden) {
      return EditAction.hide;
    }

    // else return standard
    return EditAction.standard;
  });

  const persistHiddenAssets = useCallback((hiddenAssets: Array<UniqueId>) => {
    userAssetsStore.getState().setHiddenAssets(hiddenAssets);
    // TODO: Bring in initial pinned / hidden coins from mmkv
  }, []);

  const persistPinnedAssets = useCallback((pinnedAssets: Array<UniqueId>) => {
    userAssetsStore.getState().setPinnedAssets(pinnedAssets);
    // TODO: Bring in initial pinned / hidden coins from mmkv
  }, []);

  const finishEditing = useCallback(
    (action: EditAction) => {
      'worklet';

      const selectedIds = Array.from(selectedAssets.value);

      switch (action) {
        case EditAction.pin: {
          // Add selected assets to pinned assets - ensure no duplicates
          const newPinnedAssets = [...new Set([...pinnedAssets.value, ...selectedIds])];
          pinnedAssets.value = newPinnedAssets;

          // Remove from hidden assets when pinning
          const newHiddenAssets = hiddenAssets.value.filter(id => !selectedIds.includes(id));
          if (newHiddenAssets.length !== hiddenAssets.value.length) {
            hiddenAssets.value = newHiddenAssets;
            runOnJS(persistHiddenAssets)(newHiddenAssets);
          }

          runOnJS(persistPinnedAssets)(newPinnedAssets);
          break;
        }
        case EditAction.unpin: {
          // Remove selected assets from pinned assets
          const filteredAssets = pinnedAssets.value.filter(id => !selectedIds.includes(id));
          pinnedAssets.value = filteredAssets;
          runOnJS(persistPinnedAssets)(filteredAssets);
          break;
        }
        case EditAction.hide: {
          // Add selected assets to hidden assets - ensure no duplicates
          const newHiddenAssets = [...new Set([...hiddenAssets.value, ...selectedIds])];
          hiddenAssets.value = newHiddenAssets;

          // Remove from pinned assets when hiding
          const newPinnedAssets = pinnedAssets.value.filter(id => !selectedIds.includes(id));
          if (newPinnedAssets.length !== pinnedAssets.value.length) {
            pinnedAssets.value = newPinnedAssets;
            runOnJS(persistPinnedAssets)(newPinnedAssets);
          }

          runOnJS(persistHiddenAssets)(newHiddenAssets);
          break;
        }
        case EditAction.unhide: {
          // Remove selected assets from hidden assets
          const filteredAssets = hiddenAssets.value.filter(id => !selectedIds.includes(id));
          hiddenAssets.value = filteredAssets;
          runOnJS(persistHiddenAssets)(filteredAssets);
          break;
        }
        case EditAction.standard: {
          // In standard mode, we'll handle pinning/unpinning and hiding/unhiding based on current state
          // For assets that are neither pinned nor hidden, we'll pin them
          const assetsToPinIds = selectedIds.filter(id => !pinnedAssets.value.includes(id) && !hiddenAssets.value.includes(id));

          if (assetsToPinIds.length > 0) {
            const newPinnedAssets = [...pinnedAssets.value, ...assetsToPinIds];
            pinnedAssets.value = newPinnedAssets;
            runOnJS(persistPinnedAssets)(newPinnedAssets);
          }
          break;
        }
        case EditAction.none:
          break;
      }

      // Clear selected assets after any action
      selectedAssets.value = [];
    },
    [hiddenAssets, pinnedAssets, selectedAssets, persistHiddenAssets, persistPinnedAssets]
  );

  const setAssetsCount = useCallback((count: number) => {
    walletAssetsStore.getState().setTotalAssets(count);
  }, []);

  useAnimatedReaction(
    () => sections.value,
    currentSections => {
      if (currentSections.length === 1 && currentSections[0].type === 'divider') return;
      runOnJS(setAssetsCount)(currentSections.length < MAX_CONDENSED_ASSETS ? currentSections.length - 1 : currentSections.length);
    },
    [sections]
  );

  return (
    <UserAssetsListContext.Provider
      value={{
        selectedAssets,
        sections,
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

const buildSection = (assets: ParsedSearchAsset[], sectionId: SectionIds): AssetListItem[] => {
  'worklet';
  return assets.map(asset => ({ type: 'asset' as const, asset, sectionId }));
};

const buildSections = (userAssets: ParsedSearchAsset[], isExpanded: boolean): UserAssetListItem[] => {
  'worklet';
  if (userAssets.length <= MAX_CONDENSED_ASSETS || !isExpanded) {
    const topSection = buildSection(userAssets.slice(0, MAX_CONDENSED_ASSETS), 'top-assets');
    const divider = { type: 'divider' as const, sectionId: 'divider' as const };

    return [...topSection, divider];
  } else {
    const topSection = buildSection(userAssets.slice(0, MAX_CONDENSED_ASSETS), 'top-assets');
    const divider = { type: 'divider' as const, sectionId: 'divider' as const };
    const bottomSection = buildSection(userAssets.slice(MAX_CONDENSED_ASSETS), 'bottom-assets');

    return [...topSection, divider, ...bottomSection];
  }
};

export function SyncUserAssetsStoreWithContext() {
  const { accountAddress } = useAccountSettings();
  const { sections, isExpanded } = useUserAssetsListContext();
  const userAssets = useUserAssetsStore(state => state.getUserAssetsWithPinnedFirstAndHiddenAssetsLast());

  useAnimatedReaction(
    () => ({
      userAssets,
      isExpanded: isExpanded.value,
    }),
    acc => {
      // FIXME: Implement this to prevent unnecessary updates
      // if (deepEqual(acc.userAssets, previous?.userAssets) && acc.isExpanded === previous?.isExpanded) return;

      sections.value = buildSections(acc.userAssets, acc.isExpanded);
    },
    [userAssets]
  );

  // Update the total assets count when the account address changes
  useEffect(() => {
    if (walletAssetsStore.getState().currentAccountAddress !== accountAddress) {
      walletAssetsStore.getState().setTotalAssets(userAssets.length ? Math.min(userAssets.length, MAX_CONDENSED_ASSETS + 1) : 0);
    }
  }, [accountAddress, userAssets?.length]);

  return null;
}
