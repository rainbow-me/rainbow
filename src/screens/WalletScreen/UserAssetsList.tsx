import React, { memo, useCallback, useMemo, useRef } from 'react';
import { subWorklet } from '@/safe-math/SafeMath';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { FlatList, InteractionManager } from 'react-native';
import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Box, Text } from '@/design-system';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { deviceUtils } from '@/utils';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { useAccountSettings } from '@/hooks';
import { useScrollPosition } from './ScrollPositionContext';
import { useMMKVObject } from 'react-native-mmkv';
import { difference } from 'lodash';
import { BaseButton } from '@/components/DappBrowser/TabViewToolbar';

const MAX_CONDENSED_ASSETS = 6;
const DIVIDER_HEIGHT = 40;

// Define the edit actions enum (similar to useCoinListEditOptions)
export enum EditAction {
  none = 'NONE',
  standard = 'STANDARD',
  pin = 'PIN',
  unpin = 'UNPIN',
  hide = 'HIDE',
  unhide = 'UNHIDE',
}

// Define the boolean map interface from useCoinListEditOptions
export interface BooleanMap {
  [index: string]: boolean;
}

type AssetsListStore = {
  selectedAssets: Set<UniqueId>;
  isExpanded: boolean;
  toggleIsExpanded: () => void;
  isEditMode: boolean;
  toggleEditMode: () => void;

  // Add functions to manage selected assets
  clearSelectedAssets: () => void;
  toggleSelectedAsset: (assetId: UniqueId) => void;
  addSelectedAsset: (assetId: UniqueId) => void;
  removeSelectedAsset: (assetId: UniqueId) => void;

  // Current action based on selection
  getCurrentAction: (pinnedAssets: BooleanMap, hiddenAssets: string[]) => EditAction;
};

const assetsListStore = createRainbowStore<AssetsListStore>((set, get) => ({
  selectedAssets: new Set(),
  isExpanded: false,
  toggleIsExpanded: () => set(s => ({ isExpanded: !s.isExpanded })),
  isEditMode: false,
  toggleEditMode: () =>
    set(s => ({
      isEditMode: !s.isEditMode,
      // Clear selections when toggling edit mode off
      selectedAssets: !s.isEditMode ? s.selectedAssets : new Set(),
    })),

  // Implement selection management functions
  clearSelectedAssets: () => set({ selectedAssets: new Set() }),

  toggleSelectedAsset: (assetId: UniqueId) =>
    set(state => {
      const newSelectedAssets = new Set(state.selectedAssets);
      if (newSelectedAssets.has(assetId)) {
        newSelectedAssets.delete(assetId);
      } else {
        newSelectedAssets.add(assetId);
      }
      return { selectedAssets: newSelectedAssets };
    }),

  addSelectedAsset: (assetId: UniqueId) =>
    set(state => {
      const newSelectedAssets = new Set(state.selectedAssets);
      newSelectedAssets.add(assetId);
      return { selectedAssets: newSelectedAssets };
    }),

  removeSelectedAsset: (assetId: UniqueId) =>
    set(state => {
      const newSelectedAssets = new Set(state.selectedAssets);
      newSelectedAssets.delete(assetId);
      return { selectedAssets: newSelectedAssets };
    }),

  // Function to determine current action based on selected assets
  getCurrentAction: (pinnedAssets, hiddenAssets) => {
    const state = get();
    const selectedAssets = Array.from(state.selectedAssets);
    const selectedCount = selectedAssets.length;

    if (selectedCount === 0) {
      return EditAction.none;
    } else if (selectedCount > 0 && difference(hiddenAssets, selectedAssets).length === hiddenAssets.length - selectedCount) {
      return EditAction.unhide;
    } else if (
      selectedCount > 0 &&
      difference(Object.keys(pinnedAssets), selectedAssets).length === Object.keys(pinnedAssets).length - selectedCount
    ) {
      return EditAction.unpin;
    } else {
      return EditAction.standard;
    }
  },
}));

// Create a custom hook that combines the store with ScrollPosition context
export function useAssetsListStore<T>(selector: (state: AssetsListStore) => T): T {
  return assetsListStore(selector);
}

// Hook to get the toggle functions with content size updates
export function useAssetsListControls() {
  const { toggleIsExpanded, toggleEditMode } = assetsListStore(state => ({
    toggleIsExpanded: state.toggleIsExpanded,
    toggleEditMode: state.toggleEditMode,
  }));
  const { updateContentSize } = useScrollPosition();

  const handleToggleExpand = useCallback(() => {
    toggleIsExpanded();

    InteractionManager.runAfterInteractions(() => {
      updateContentSize();
    });
  }, [toggleIsExpanded, updateContentSize]);

  const handleToggleEditMode = useCallback(() => {
    toggleEditMode();
  }, [toggleEditMode]);

  return {
    handleToggleExpand,
    handleToggleEditMode,
  };
}

// New hook for asset list edit options
export function useAssetListEditOptions() {
  const { accountAddress } = useAccountSettings();
  const hiddenAssets = useUserAssetsStore(state => state.getHiddenAssetsIds());
  const setHiddenAssets = useUserAssetsStore(state => state.setHiddenAssets);

  // Get selection management functions from the store
  const { selectedAssets, clearSelectedAssets, toggleSelectedAsset, addSelectedAsset, removeSelectedAsset, getCurrentAction } =
    assetsListStore(state => ({
      selectedAssets: state.selectedAssets,
      clearSelectedAssets: state.clearSelectedAssets,
      toggleSelectedAsset: state.toggleSelectedAsset,
      addSelectedAsset: state.addSelectedAsset,
      removeSelectedAsset: state.removeSelectedAsset,
      getCurrentAction: state.getCurrentAction,
    }));

  // Use MMKV for persisted pinned assets (just like in useCoinListEditOptions)
  const [pinnedAssets = {}, setPinnedAssetsObject] = useMMKVObject<BooleanMap>('pinned-coins-obj-' + accountAddress);

  // Calculate current action based on selected assets
  const currentAction = useMemo(() => {
    return getCurrentAction(pinnedAssets, hiddenAssets);
  }, [getCurrentAction, pinnedAssets, hiddenAssets]);

  // Function to finish editing (apply changes)
  const finishEditing = useCallback(
    (action: EditAction) => {
      const selectedAssetsArray = Array.from(selectedAssets);

      switch (action) {
        case EditAction.pin: {
          // Add selected assets to pinned assets
          const updatedPinnedAssets = { ...pinnedAssets };
          selectedAssetsArray.forEach(assetId => {
            updatedPinnedAssets[assetId] = true;
          });
          setPinnedAssetsObject(updatedPinnedAssets);
          break;
        }
        case EditAction.unpin: {
          // Remove selected assets from pinned assets
          const updatedPinnedAssets = { ...pinnedAssets };
          selectedAssetsArray.forEach(assetId => {
            delete updatedPinnedAssets[assetId];
          });
          setPinnedAssetsObject(updatedPinnedAssets);
          break;
        }
        case EditAction.hide: {
          // Add selected assets to hidden assets
          const newHiddenAssets = [...hiddenAssets, ...selectedAssetsArray];
          setHiddenAssets(newHiddenAssets);
          break;
        }
        case EditAction.unhide: {
          // Remove selected assets from hidden assets
          const newHiddenAssets = hiddenAssets.filter(id => !selectedAssets.has(id));
          setHiddenAssets(newHiddenAssets);
          break;
        }
        default:
          break;
      }

      // Clear selections after applying changes
      clearSelectedAssets();
    },
    [selectedAssets, pinnedAssets, hiddenAssets, setPinnedAssetsObject, setHiddenAssets, clearSelectedAssets]
  );

  return {
    selectedAssets,
    pinnedAssets,
    hiddenAssets,
    clearSelectedAssets,
    toggleSelectedAsset,
    addSelectedAsset,
    removeSelectedAsset,
    currentAction,
    finishEditing,
  };
}

type SectionIds = 'top-assets' | 'divider' | 'bottom-assets' | 'hidden-assets';

interface AssetListItem {
  type: 'asset';
  asset: ParsedSearchAsset;
  sectionId: SectionIds;
}

interface DividerListItem {
  type: 'divider';
  sectionId: SectionIds;
}

type UserAssetListItem = AssetListItem | DividerListItem;

// This is a crucial optimization for FlatList performance
const getItemLayout = (data: ArrayLike<UserAssetListItem> | null | undefined, index: number) => {
  if (!data) return { length: 0, offset: 0, index };

  const item = data[index];
  const length = item?.type === 'divider' ? DIVIDER_HEIGHT : COIN_ROW_WITH_PADDING_HEIGHT;

  // Calculate the offset by summing up heights of previous items
  let offset = 0;
  for (let i = 0; i < index; i++) {
    const prevItem = data[i];
    offset += prevItem?.type === 'divider' ? DIVIDER_HEIGHT : COIN_ROW_WITH_PADDING_HEIGHT;
  }

  return { length, offset, index };
};

const keyExtractor = (item: UserAssetListItem): string => {
  if (item.type === 'asset') {
    return `asset-${item.asset.uniqueId}`;
  }
  return `divider-${item.sectionId}`;
};

const MemoizedCoinRow = memo(
  ({ asset, navigateToTokenChart }: { asset: ParsedSearchAsset; navigateToTokenChart: (asset: ParsedSearchAsset) => void }) => (
    <CoinRow
      onPress={() => navigateToTokenChart(asset)}
      output={false}
      uniqueIdOrAsset={asset}
      nativePriceChange={asset.native.price?.change}
      showPriceChange
      testID={`asset-list-item-${asset.uniqueId}`}
    />
  ),
  (prevProps, nextProps) => prevProps.asset.uniqueId === nextProps.asset.uniqueId
);
MemoizedCoinRow.displayName = 'MemoizedCoinRow';

export function UserAssetsList() {
  const { navigate } = useNavigation();
  const { isExpanded } = useAssetsListStore(state => state);
  const userAssets = useUserAssetsStore(state => state.getUserAssets());
  const flatListRef = useRef<FlatList<UserAssetListItem>>(null);

  const { topAssets, bottomAssets } = useMemo(() => {
    if (userAssets.length <= MAX_CONDENSED_ASSETS) {
      return { topAssets: userAssets, bottomAssets: [] };
    }
    return {
      topAssets: userAssets.slice(0, MAX_CONDENSED_ASSETS),
      bottomAssets: userAssets.slice(MAX_CONDENSED_ASSETS),
    };
  }, [userAssets]);

  const sectionedData = useMemo(() => {
    const data: UserAssetListItem[] = [
      ...topAssets.map(asset => ({
        type: 'asset' as const,
        asset,
        sectionId: 'top-assets' as SectionIds,
      })),
      { type: 'divider', sectionId: 'divider' },
    ];

    if (isExpanded && bottomAssets.length > 0) {
      data.push(
        ...bottomAssets.map(asset => ({
          type: 'asset' as const,
          asset,
          sectionId: 'bottom-assets' as SectionIds,
        }))
      );
    }

    return data;
  }, [topAssets, bottomAssets, isExpanded]);

  const navigateToTokenChart = useCallback(
    (asset: ParsedSearchAsset) => {
      navigate(Routes.EXPANDED_ASSET_SHEET_V2, { asset, address: asset.address, chainId: asset.chainId });
    },
    [navigate]
  );

  const renderItem = useCallback(
    ({ item }: { item: UserAssetListItem }) => {
      if (item.type === 'divider') {
        return <DividerSection />;
      }

      return <MemoizedCoinRow asset={item.asset} navigateToTokenChart={navigateToTokenChart} />;
    },
    [navigateToTokenChart]
  );

  // Calculate height for both the container and the FlatList
  const listHeight = useMemo(() => {
    const topAssetsHeight = topAssets.length * COIN_ROW_WITH_PADDING_HEIGHT;
    const dividerHeight = DIVIDER_HEIGHT;
    const bottomAssetsHeight = isExpanded ? bottomAssets.length * COIN_ROW_WITH_PADDING_HEIGHT : 0;

    return topAssetsHeight + dividerHeight + bottomAssetsHeight;
  }, [topAssets, bottomAssets, isExpanded]);

  return (
    <FlatList
      data={sectionedData}
      ref={flatListRef}
      getItemLayout={getItemLayout}
      initialNumToRender={MAX_CONDENSED_ASSETS + 2}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="always"
      removeClippedSubviews={false}
      renderItem={renderItem}
      scrollEnabled={false}
      style={{ height: listHeight, width: deviceUtils.dimensions.width }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const DividerSection = memo(function DividerSection() {
  const { nativeCurrency } = useAccountSettings();
  const { isExpanded, isEditMode } = useAssetsListStore(state => state);
  const { handleToggleExpand, handleToggleEditMode } = useAssetsListControls();

  const { selectedAssets, finishEditing, currentAction } = useAssetListEditOptions();

  const totalBalance = useUserAssetsStore(state => state.getTotalBalance());
  const hiddenBalance = useUserAssetsStore(state => state.hiddenAssetsBalance);

  const balance = useMemo(() => {
    if (typeof totalBalance === 'undefined') return undefined;
    if (!hiddenBalance) return totalBalance;
    return subWorklet(totalBalance, hiddenBalance);
  }, [totalBalance, hiddenBalance]);

  // Handle pin button press
  const handlePinPress = useCallback(() => {
    finishEditing(EditAction.pin);
  }, [finishEditing]);

  // Handle hide button press
  const handleHidePress = useCallback(() => {
    finishEditing(EditAction.hide);
  }, [finishEditing]);

  // Handle action based on current selection context
  const handleActionPress = useCallback(() => {
    if (currentAction === EditAction.unhide) {
      finishEditing(EditAction.unhide);
    } else if (currentAction === EditAction.unpin) {
      finishEditing(EditAction.unpin);
    } else {
      // Toggle edit mode if no specific action
      handleToggleEditMode();
    }
  }, [currentAction, finishEditing, handleToggleEditMode]);

  return (
    <Box
      paddingHorizontal="12px"
      paddingVertical="6px"
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      height={DIVIDER_HEIGHT}
      testID="assets-list-divider"
    >
      {!isEditMode && (
        <BaseButton
          gestureButtonProps={{ style: { paddingHorizontal: 8 } }}
          paddingHorizontal="12px"
          paddingVertical="10px"
          onPress={handleToggleExpand}
        >
          <Box gap={isExpanded ? 4 : 0} flexDirection="row" alignItems="center" justifyContent="center">
            <Text color="labelTertiary" size="17pt" weight="semibold" numberOfLines={1}>
              {isExpanded ? 'Less' : 'All'}
            </Text>
            <Text size="15pt" color="labelTertiary" weight="bold">
              {isExpanded ? '􀆇' : ' 􀆊'}
            </Text>
          </Box>
        </BaseButton>
      )}
      {isEditMode && (
        <Box gap={8} flexDirection="row" alignItems="center">
          <BaseButton
            scaleTo={selectedAssets.size === 0 ? 1 : undefined}
            disableHaptics={selectedAssets.size === 0}
            buttonColor={selectedAssets.size > 0 ? 'accent' : 'fillTertiary'}
            gestureButtonProps={{ style: { paddingHorizontal: 8 } }}
            paddingHorizontal="12px"
            paddingVertical="10px"
            onPress={handlePinPress}
          >
            <Text color={selectedAssets.size > 0 ? 'label' : 'labelQuaternary'} size="17pt" weight="semibold" numberOfLines={1}>
              {currentAction === EditAction.unpin ? 'Unpin' : 'Pin'}
            </Text>
          </BaseButton>
          <BaseButton
            scaleTo={selectedAssets.size === 0 ? 1 : undefined}
            disableHaptics={selectedAssets.size === 0}
            buttonColor={selectedAssets.size > 0 ? 'accent' : 'fillTertiary'}
            gestureButtonProps={{ style: { paddingHorizontal: 8 } }}
            paddingHorizontal="12px"
            paddingVertical="10px"
            onPress={handleHidePress}
          >
            <Text color={selectedAssets.size > 0 ? 'label' : 'labelQuaternary'} size="17pt" weight="semibold" numberOfLines={1}>
              {currentAction === EditAction.unhide ? 'Unhide' : 'Hide'}
            </Text>
          </BaseButton>
        </Box>
      )}
      {!isExpanded && (
        <Text color="labelTertiary" size="17pt" weight="semibold" numberOfLines={1}>
          {convertAmountToNativeDisplay(balance ?? '0', nativeCurrency)}
        </Text>
      )}
      {isExpanded && (
        <BaseButton
          buttonColor={isEditMode ? 'accent' : 'fillSecondary'}
          gestureButtonProps={{ style: { paddingHorizontal: 8 } }}
          paddingHorizontal="12px"
          paddingVertical="10px"
          onPress={handleActionPress}
        >
          <Text color={isEditMode ? 'label' : 'labelTertiary'} size="17pt" weight="semibold" numberOfLines={1}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </BaseButton>
      )}
    </Box>
  );
});
