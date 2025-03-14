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
  toggleSelectedAsset: (index: number) => void;
  toggleExpanded: () => void;
  toggleEditing: () => void;
};

type UserAssetsListContextType = {
  flatlistRef: AnimatedRef<Animated.FlatList<number>> | undefined;
  selectedAssets: SharedValue<Array<UniqueId>>;
  sections: SharedValue<UserAssetListItem[]>;
  isExpanded: SharedValue<boolean>;
  isEditing: SharedValue<boolean>;
  currentAction: SharedValue<EditAction>;
} & UserAssetsListActions;

export const UserAssetsListContext = createContext<UserAssetsListContextType>({
  flatlistRef: undefined,
  selectedAssets: makeMutable<Array<UniqueId>>([]),
  sections: makeMutable<UserAssetListItem[]>([]),
  isExpanded: makeMutable<boolean>(false),
  isEditing: makeMutable<boolean>(false),
  currentAction: makeMutable<EditAction>(EditAction.none),
  toggleSelectedAsset: noop,
  toggleExpanded: noop,
  toggleEditing: noop,
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
    (index: number) => {
      'worklet';
      // shift indices to account for the divider
      if (index >= MAX_CONDENSED_ASSETS) {
        index = index + 1;
      }

      const asset = sections.value[index] as AssetListItem;
      if (!asset) return;

      selectedAssets.modify(set => {
        if (set.includes(asset.asset.uniqueId)) {
          set.splice(set.indexOf(asset.asset.uniqueId), 1);
        } else {
          set.push(asset.asset.uniqueId);
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
  }, [accountAddress]);

  return null;
}
