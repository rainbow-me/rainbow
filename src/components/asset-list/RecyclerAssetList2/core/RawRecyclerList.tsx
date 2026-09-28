import React, { useCallback, useEffect, useMemo, useRef, type LegacyRef } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { useListen } from '@storesjs/stores';
import { type SetterOrUpdater } from 'recoil';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import { useMemoOne } from 'use-memo-one';

import { type UniqueId } from '@/__swaps__/types/assets';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { useExperimentalConfig } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import type { NativeCurrencyKey } from '@/features/currency/types';
import {
  ExternalENSProfileScrollViewWithRef,
  ExternalSelectNFTScrollViewWithRef,
} from '@/features/ens/components/ExternalENSProfileScrollView';
import useAccountSettings from '@/hooks/useAccountSettings';
import useCoinListEdited from '@/hooks/useCoinListEdited';
import useCoinListEditOptions, { type BooleanMap } from '@/hooks/useCoinListEditOptions';
import { useRecyclerListViewScrollToTopContext } from '@/navigation/RecyclerListViewScrollToTopContext';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useTheme, type ThemeContextProps } from '@/theme/ThemeContext';
import { deviceUtils } from '@/utils/deviceUtils';

import { type AssetListType } from '..';
import { useWalletsStore } from '../../../../state/wallets/walletsStore';
import { useRecyclerAssetListPosition } from './Contexts';
import { ExternalScrollViewWithRef } from './ExternalScrollView';
import { getLayoutProvider } from './getLayoutProvider';
import { RefreshControlWrapped as RefreshControl } from './RefreshControl';
import rowRenderer from './RowRenderer';
import useLayoutItemAnimator from './useLayoutItemAnimator';
import { type BaseCellType, type CellTypes, type RecyclerListViewRef } from './ViewTypes';

const dimensions = {
  height: deviceUtils.dimensions.height,
  width: deviceUtils.dimensions.width,
};

const dataProvider = new DataProvider((r1: CellTypes, r2: CellTypes) => {
  return r1.uid !== r2.uid;
});

export type ExtendedState = {
  theme: ThemeContextProps;
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

export type ViewableItemsChangedCallback = ({ viewableItems }: { viewableItems: BaseCellType[] }) => void;

export const RawMemoRecyclerAssetList = React.memo(function RawRecyclerAssetList({
  briefSectionsData,
  disablePullDownToRefresh,
  scrollIndicatorInsets,
  extendedState,
  onEndReached,
  type,
  onViewableItemsChanged,
}: {
  briefSectionsData: CellTypes[];
  disablePullDownToRefresh: boolean;
  extendedState: Partial<ExtendedState> & Pick<ExtendedState, 'additionalData'>;
  scrollIndicatorInsets?: object;
  onEndReached?: () => void;
  type?: AssetListType;
  onViewableItemsChanged?: ViewableItemsChangedCallback;
}) {
  const remoteConfig = useRemoteConfig();
  const experimentalConfig = useExperimentalConfig();
  const currentDataProvider = useMemoOne(() => dataProvider.cloneWithRows(briefSectionsData), [briefSectionsData]);
  const { isCoinListEdited, setIsCoinListEdited } = useCoinListEdited();
  const y = useRecyclerAssetListPosition();
  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const viewableIndicesRef = useRef<number[]>([]);

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

  const { setScrollToTopRef } = useRecyclerListViewScrollToTopContext();

  const topMarginRef = useRef<number>(0);
  const ref = useRef<RecyclerListViewRef>(undefined);

  useListen(
    useWalletsStore,
    state => state.accountAddress,
    () => {
      ref.current?.scrollToTop();
      topMarginRef.current = 0;
      y?.setValue(0);
    }
  );

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
    (viewableIndices: number[]) => {
      viewableIndicesRef.current = viewableIndices;
      onViewableItemsChanged?.({ viewableItems: viewableIndices.map(index => briefSectionsData[index]) });
    },
    [onViewableItemsChanged, briefSectionsData]
  );

  // Row identities can change without a change to the visible indices.
  useEffect(() => {
    handleViewableIndicesChanged(viewableIndicesRef.current);
  }, [handleViewableIndicesChanged]);

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
      // @ts-expect-error - scrollview refs are typed differently
      externalScrollView={
        type === 'ens-profile'
          ? ExternalENSProfileScrollViewWithRef
          : type === 'select-nft'
            ? ExternalSelectNFTScrollViewWithRef
            : ExternalScrollViewWithRef
      }
      itemAnimator={layoutItemAnimator}
      layoutProvider={layoutProvider}
      onEndReachedThreshold={0.5}
      onEndReached={onEndReached}
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
