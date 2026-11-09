import React, { useCallback, useMemo, useRef, type LegacyRef } from 'react';

import { useListen } from '@storesjs/stores';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecyclerListView } from 'recyclerlistview';

import type { UniqueAsset } from '@/entities/uniqueAssets';
import {
  ExternalENSProfileScrollViewWithRef,
  ExternalSelectNFTScrollViewWithRef,
} from '@/features/ens/components/ExternalENSProfileScrollView';
import { useExtendedStateStore } from '@/features/wallet/data/walletScreen/composition/useExtendedState';
import { type WalletListData } from '@/features/wallet/data/walletScreen/composition/useWalletSectionsData';
import { useOnChange } from '@/hooks/useOnChange';
import { useStableValue } from '@/hooks/useStableValue';
import { useOnTabReselect } from '@/navigation/tabEvents';
import { deviceUtils } from '@/utils/deviceUtils';

import { type AssetListType } from '..';
import { useWalletsStore } from '../../../../state/wallets/walletsStore';
import { AssetListItemAnimator } from './assetListItemAnimator';
import { useRecyclerAssetListPosition } from './Contexts';
import { ExternalScrollViewWithRef } from './ExternalScrollView';
import { RefreshControlWrapped as RefreshControl } from './RefreshControl';
import rowRenderer from './RowRenderer';
import { type BaseCellType, type RecyclerListViewRef } from './ViewTypes';

const dimensions = {
  height: deviceUtils.dimensions.height,
  width: deviceUtils.dimensions.width,
};

export type ExtendedState = ReturnType<typeof useExtendedStateStore.getState> & {
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
};

/** Receives the complete visible row set, including identity changes at unchanged indices. */
export type ViewableItemsChangedCallback = ({ viewableItems }: { viewableItems: BaseCellType[] }) => void;

export const RawMemoRecyclerAssetList = React.memo(function RawRecyclerAssetList({
  listData,
  disablePullDownToRefresh,
  scrollIndicatorInsets,
  extendedState,
  onEndReached,
  type,
  onViewableItemsChanged,
}: {
  listData: WalletListData;
  disablePullDownToRefresh: boolean;
  extendedState: Pick<ExtendedState, 'externalAddress' | 'onPressUniqueToken'>;
  scrollIndicatorInsets?: object;
  onEndReached?: () => void;
  type?: AssetListType;
  onViewableItemsChanged?: ViewableItemsChangedCallback;
}) {
  const { briefSectionsData, dataProvider, layoutProvider } = listData;
  const sharedExtendedState = useExtendedStateStore();
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

  const mergedExtendedState = useMemo<ExtendedState>(
    () => ({ ...sharedExtendedState, ...extendedState }),
    [sharedExtendedState, extendedState]
  );

  return (
    <RecyclerListView
      automaticallyAdjustScrollIndicatorInsets={true}
      dataProvider={dataProvider}
      extendedState={mergedExtendedState}
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
