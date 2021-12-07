import React, { LegacyRef, useCallback, useRef } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import { useMemoOne } from 'use-memo-one';
import ExternalScrollViewWithRef from './ExternalScrollView';
import rowRenderer from './RowRenderer';
import { BaseCellType, RecyclerListViewRef } from './ViewTypes';
import getLayoutProvider from './getLayoutProvider';
import useLayoutItemAnimator from './useLayoutItemAnimator';

const dataProvider = new DataProvider((r1, r2) => {
  return r1.uid === r2.uid;
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

  const layoutProvider = useMemoOne(
    () => getLayoutProvider(briefSectionsData),
    [briefSectionsData]
  );

  const topMarginRef = useRef<number>(0);

  const ref = useRef<RecyclerListViewRef>();
  const onLayout = useCallback(
    () => ({ nativeEvent }: LayoutChangeEvent) => {
      topMarginRef.current = nativeEvent.layout.y
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
      renderAheadOffset={2000}
      rowRenderer={rowRenderer}
    />
  );
});

export default RawMemoRecyclerAssetList;
