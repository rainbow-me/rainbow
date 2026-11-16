import React, { useCallback, useRef, type LegacyRef } from 'react';

import { useListen } from '@storesjs/stores';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecyclerListView, type RecyclerListViewProps } from 'recyclerlistview';

import {
  ExternalENSProfileScrollViewWithRef,
  ExternalSelectNFTScrollViewWithRef,
} from '@/features/ens/components/ExternalENSProfileScrollView';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import { useOnTabReselect } from '@/navigation/tabEvents';
import { deviceUtils } from '@/utils/deviceUtils';

import { useWalletsStore } from '../../../../state/wallets/walletsStore';
import { AssetListItemAnimator } from './assetListItemAnimator';
import { useRecyclerAssetListPosition } from './Contexts';
import { type AssetListData } from './createListData';
import { ExternalScrollViewWithRef } from './ExternalScrollView';
import { RefreshControlWrapped as RefreshControl } from './RefreshControl';
import { type CellTypes, type RecyclerListViewRef } from './ViewTypes';

const dimensions = {
  height: deviceUtils.dimensions.height,
  width: deviceUtils.dimensions.width,
};

/** Receives the complete visible row set, including identity changes at unchanged indices. */
export type ViewableItemsChangedCallback = ({ viewableItems }: { viewableItems: CellTypes[] }) => void;

export const RawMemoRecyclerAssetList = React.memo(function RawRecyclerAssetList({
  listData,
  disablePullDownToRefresh,
  scrollIndicatorInsets,
  extendedState,
  rowRenderer,
  onEndReached,
  type,
  onViewableItemsChanged,
}: {
  listData: AssetListData;
  disablePullDownToRefresh: boolean;
  extendedState: object;
  rowRenderer: RecyclerListViewProps['rowRenderer'];
  scrollIndicatorInsets?: object;
  onEndReached?: () => void;
  type: 'wallet' | 'ens-profile' | 'select-nft';
  onViewableItemsChanged?: ViewableItemsChangedCallback;
}) {
  const { briefSectionsData, dataProvider, layoutProvider } = listData;
  const y = useRecyclerAssetListPosition();
  const viewableIndicesRef = useRef<number[]>([]);

  const topInset = useSafeAreaInsets().top;
  const ref = useRef<RecyclerListViewRef>(undefined);
  const itemAnimator = useStableValue(() => new AssetListItemAnimator(ref));

  useListen(
    useWalletsStore,
    state => state.accountAddress,
    () => {
      ref.current?.scrollToTop();
      y?.setValue(0);
    }
  );

  useOnTabReselect(() => ref.current?.scrollToOffset(0, -topInset, true));

  const handleViewableIndicesChanged = useCallback(
    (viewableIndices: number[]) => {
      viewableIndicesRef.current = viewableIndices;
      onViewableItemsChanged?.({ viewableItems: viewableIndices.map(index => briefSectionsData[index]) });
    },
    [onViewableItemsChanged, briefSectionsData]
  );

  // RecyclerListView only reports when visible indices change, ignoring item changes.
  // This compensates by firing when list data changes.
  useOnChange(() => {
    handleViewableIndicesChanged(viewableIndicesRef.current);
  }, [handleViewableIndicesChanged]);

  return (
    <RecyclerListView
      automaticallyAdjustScrollIndicatorInsets={true}
      dataProvider={dataProvider}
      extendedState={extendedState}
      // @ts-expect-error - scrollview refs are typed differently
      externalScrollView={
        type === 'ens-profile'
          ? ExternalENSProfileScrollViewWithRef
          : type === 'select-nft'
            ? ExternalSelectNFTScrollViewWithRef
            : ExternalScrollViewWithRef
      }
      itemAnimator={itemAnimator}
      layoutProvider={layoutProvider}
      onEndReachedThreshold={0.5}
      onEndReached={onEndReached}
      ref={ref as LegacyRef<RecyclerListViewRef>}
      refreshControl={disablePullDownToRefresh ? undefined : <RefreshControl />}
      renderAheadOffset={1000}
      rowRenderer={rowRenderer}
      canChangeSize={type === 'wallet'}
      layoutSize={type === 'wallet' ? dimensions : undefined}
      scrollIndicatorInsets={scrollIndicatorInsets}
      scrollViewProps={itemAnimator.scrollViewProps}
      onVisibleIndicesChanged={handleViewableIndicesChanged}
    />
  );
});
