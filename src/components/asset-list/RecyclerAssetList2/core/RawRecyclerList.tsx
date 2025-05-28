import React, { LegacyRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { SetterOrUpdater } from 'recoil';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import { useMemoOne } from 'use-memo-one';
import { BooleanMap } from '../../../../hooks/useCoinListEditOptions';
import { AssetListType } from '..';
import { useRecyclerAssetListPosition } from './Contexts';
import { ExternalENSProfileScrollViewWithRef, ExternalSelectNFTScrollViewWithRef } from './ExternalENSProfileScrollView';
import ExternalScrollViewWithRef from './ExternalScrollView';
import RefreshControl from './RefreshControl';
import rowRenderer from './RowRenderer';
import { CellTypes, RecyclerListViewRef } from './ViewTypes';
import getLayoutProvider from './getLayoutProvider';
import useLayoutItemAnimator from './useLayoutItemAnimator';
import { NativeCurrencyKey, UniqueAsset } from '@/entities';
import { useRecyclerListViewScrollToTopContext } from '@/navigation/RecyclerListViewScrollToTopContext';
import { useAccountSettings, useCoinListEdited, useCoinListEditOptions, usePrevious } from '@/hooks';
import { useTheme } from '@/theme';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useExperimentalConfig } from '@/config/experimentalHooks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { UniqueId } from '@/__swaps__/types/assets';
import { deviceUtils } from '@/utils';

const dimensions = {
  height: deviceUtils.dimensions.height,
  width: deviceUtils.dimensions.width,
};

const dataProvider = new DataProvider((r1: CellTypes, r2: CellTypes) => {
  return r1.uid !== r2.uid;
});

export type ExtendedState = {
  theme: any;
  nativeCurrencySymbol: string;
  nativeCurrency: NativeCurrencyKey;
  isCoinListEdited: boolean;
  hiddenAssets: Set<UniqueId>;
  pinnedCoins: BooleanMap;
  toggleSelectedCoin: (id: string) => void;
  setIsCoinListEdited: SetterOrUpdater<boolean>;
  additionalData: Record<string, CellTypes>;
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
};

export type ViewableItemsChangedCallback = ({
  viewableItems,
  viewableItemsAdded,
  viewableItemsRemoved,
}: {
  viewableItems: CellTypes[];
  viewableItemsAdded: CellTypes[];
  viewableItemsRemoved: CellTypes[];
}) => void;

const RawMemoRecyclerAssetList = React.memo(function RawRecyclerAssetList({
  briefSectionsData,
  disablePullDownToRefresh,
  scrollIndicatorInsets,
  extendedState,
  type,
  onViewableItemsChanged,
}: {
  briefSectionsData: CellTypes[];
  disablePullDownToRefresh: boolean;
  extendedState: Partial<ExtendedState> & Pick<ExtendedState, 'additionalData'>;
  scrollIndicatorInsets?: object;
  type?: AssetListType;
  onViewableItemsChanged?: ViewableItemsChangedCallback;
}) {
  const remoteConfig = useRemoteConfig();
  const experimentalConfig = useExperimentalConfig();
  const currentDataProvider = useMemoOne(() => dataProvider.cloneWithRows(briefSectionsData), [briefSectionsData]);
  const { isCoinListEdited, setIsCoinListEdited } = useCoinListEdited();
  const y = useRecyclerAssetListPosition()!;
  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const viewableIndicesRef = useRef<number[]>([]);
  const previousData = usePrevious(briefSectionsData);

  const layoutProvider = useMemo(
    () =>
      getLayoutProvider({
        briefSectionsData,
        isCoinListEdited,
        remoteConfig,
        experimentalConfig,
      }),
    [briefSectionsData, isCoinListEdited, remoteConfig, experimentalConfig]
  );

  const { accountAddress } = useAccountSettings();
  const { setScrollToTopRef } = useRecyclerListViewScrollToTopContext();

  const topMarginRef = useRef<number>(0);
  const ref = useRef<RecyclerListViewRef>();

  useEffect(() => {
    if (ios) {
      return;
    }
    // this is hacky, but let me explain what's happening here:
    // RecyclerListView is trying to persist the position while updating the component.
    // Therefore, internally the library wants to scroll to old position.
    // However, Android is setting the position to 0, because there's no content so
    // the event has no effect on content position and this is set to 0 as expected.
    // To avoid generating this nonsense event, I firstly set internally the position to 0.
    // Then the update might happen, but this is OK, because I overrode the position
    // with `updateOffset` method. However, this is happening inside `setTimeout`
    // so the callback might be already scheduled (this is a race condition, happens randomly).
    // We need to clear this scheduled event with `clearTimeout` method.
    // Then, in case the event was not emitted, we want to emit this anyway (`scrollToOffset`)
    // to make headers located in `0` position.
    // @ts-ignore
    ref.current?._virtualRenderer?.getViewabilityTracker?.()?.updateOffset?.(0, true, 0);
    // @ts-ignore
    clearTimeout(ref.current?._processInitialOffsetTimeout);
    ref.current?.scrollToOffset(0, 0);
    y.setValue(0);
  }, [y, accountAddress]);

  useEffect(() => {
    if (!ref.current) return;

    setScrollToTopRef(ref.current);
  }, [ref, setScrollToTopRef]);

  const onLayout = useCallback(
    () =>
      ({ nativeEvent }: LayoutChangeEvent) => {
        topMarginRef.current = nativeEvent.layout.y;
      },
    []
  );

  const layoutItemAnimator = useLayoutItemAnimator(ref, topMarginRef);

  const theme = useTheme();
  const { nativeCurrencySymbol, nativeCurrency } = useAccountSettings();
  const { pinnedCoinsObj: pinnedCoins, toggleSelectedCoin } = useCoinListEditOptions();

  const handleViewableIndicesChanged = useCallback(
    (viewableIndices: number[], viewableIndicesAdded: number[], viewableIndicesRemoved: number[]) => {
      viewableIndicesRef.current = viewableIndices;
      if (!onViewableItemsChanged) return;

      const viewableItems = viewableIndices.map(index => briefSectionsData[index]);
      const viewableItemsAdded = viewableIndicesAdded.map(index => briefSectionsData[index]);
      const viewableItemsRemoved = viewableIndicesRemoved.map(index => briefSectionsData[index]);

      onViewableItemsChanged({ viewableItems, viewableItemsAdded, viewableItemsRemoved });
    },
    [onViewableItemsChanged, briefSectionsData]
  );

  // If viewable indices remain the same but the data changes, we need to trigger onViewableItemsChanged
  useEffect(() => {
    if (!onViewableItemsChanged || viewableIndicesRef.current.length === 0 || !previousData) return;

    const currentViewableIndices = viewableIndicesRef.current;

    const hasDataChanged = currentViewableIndices.some(index => {
      const prevItem = previousData[index];
      const currItem = briefSectionsData[index];

      return !prevItem || !currItem || prevItem.uid !== currItem.uid;
    });

    if (hasDataChanged) {
      const viewableItems = currentViewableIndices.map(index => briefSectionsData[index]);
      const previousViewableItems = currentViewableIndices.map(index => previousData[index]);

      const currentUids = new Set(viewableItems.map(item => item.uid));
      const previousUids = new Set(previousViewableItems.map(item => item.uid));

      const viewableItemsAdded = viewableItems.filter(item => !previousUids.has(item.uid));
      const viewableItemsRemoved = previousViewableItems.filter(item => !currentUids.has(item.uid));

      onViewableItemsChanged({ viewableItems, viewableItemsAdded, viewableItemsRemoved });
    }
  }, [briefSectionsData, onViewableItemsChanged, previousData]);

  const mergedExtendedState = useMemo<ExtendedState>(() => {
    return {
      ...extendedState,
      isCoinListEdited,
      nativeCurrency,
      nativeCurrencySymbol,
      hiddenAssets,
      pinnedCoins,
      setIsCoinListEdited,
      theme,
      toggleSelectedCoin,
    };
  }, [
    extendedState,
    isCoinListEdited,
    nativeCurrency,
    nativeCurrencySymbol,
    hiddenAssets,
    pinnedCoins,
    setIsCoinListEdited,
    theme,
    toggleSelectedCoin,
  ]);

  return (
    <RecyclerListView
      automaticallyAdjustScrollIndicatorInsets={true}
      dataProvider={currentDataProvider}
      extendedState={mergedExtendedState}
      // @ts-ignore
      externalScrollView={
        type === 'ens-profile'
          ? ExternalENSProfileScrollViewWithRef
          : type === 'select-nft'
            ? ExternalSelectNFTScrollViewWithRef
            : ExternalScrollViewWithRef
      }
      itemAnimator={layoutItemAnimator}
      layoutProvider={layoutProvider}
      onLayout={onLayout}
      ref={ref as LegacyRef<RecyclerListViewRef>}
      refreshControl={disablePullDownToRefresh ? undefined : <RefreshControl />}
      renderAheadOffset={1000}
      rowRenderer={rowRenderer}
      canChangeSize={type === 'wallet'}
      layoutSize={type === 'wallet' ? dimensions : undefined}
      scrollIndicatorInsets={scrollIndicatorInsets}
      onVisibleIndicesChanged={handleViewableIndicesChanged}
    />
  );
});

export default RawMemoRecyclerAssetList;
