import React, { LegacyRef, useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import { useMemoOne } from 'use-memo-one';
import useAccountSettings from '../../../../hooks/useAccountSettings';
import ExternalScrollViewWithRef from './ExternalScrollView';
import RefreshControl from './RefreshControl';
import rowRenderer from './RowRenderer';
import { BaseCellType, RecyclerListViewRef } from './ViewTypes';
import getLayoutProvider from './getLayoutProvider';
import useLayoutItemAnimator from './useLayoutItemAnimator';
import { useCoinListEdited } from '@rainbow-me/hooks';

const dataProvider = new DataProvider((r1, r2) => {
  return r1.uid !== r2.uid;
});

const RawMemoRecyclerAssetList = React.memo(function RawRecyclerAssetList({
  briefSectionsData,
}: {
  briefSectionsData: BaseCellType[];
}) {
  const currentDataProvider = useMemoOne(
    () => dataProvider.cloneWithRows(briefSectionsData),
    [briefSectionsData]
  );
  const { isCoinListEdited } = useCoinListEdited();

  const layoutProvider = useMemoOne(
    () => getLayoutProvider(briefSectionsData, isCoinListEdited),
    [briefSectionsData]
  );

  const { accountAddress } = useAccountSettings();

  const topMarginRef = useRef<number>(0);

  const ref = useRef<RecyclerListViewRef>();

  useEffect(() => {
    // @ts-ignore
    ref.current?._virtualRenderer
      ?.getViewabilityTracker?.()
      .updateOffset(0, true, 0);
    // @ts-ignore
    clearTimeout(ref.current?._processInitialOffsetTimeout);
    ref.current?.scrollToOffset(0, 0);
  }, [accountAddress]);

  const onLayout = useCallback(
    () => ({ nativeEvent }: LayoutChangeEvent) => {
      topMarginRef.current = nativeEvent.layout.y;
    },
    []
  );

  const layoutItemAnimator = useLayoutItemAnimator(ref, topMarginRef);

  return (
    <RecyclerListView
      dataProvider={currentDataProvider}
      // @ts-ignore
      externalScrollView={ExternalScrollViewWithRef}
      itemAnimator={layoutItemAnimator}
      layoutProvider={layoutProvider}
      onLayout={onLayout}
      ref={ref as LegacyRef<RecyclerListViewRef>}
      refreshControl={<RefreshControl />}
      renderAheadOffset={700}
      rowRenderer={rowRenderer}
    />
  );
});

export default RawMemoRecyclerAssetList;
