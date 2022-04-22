import React, { LegacyRef, useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import { useMemoOne } from 'use-memo-one';
import useAccountSettings from '../../../../hooks/useAccountSettings';
import { useRecyclerAssetListPosition } from './Contexts';
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
  const y = useRecyclerAssetListPosition()!;

  const layoutProvider = useMemoOne(
    () => getLayoutProvider(briefSectionsData, isCoinListEdited),
    [briefSectionsData]
  );

  const { accountAddress } = useAccountSettings();

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
    ref.current?._virtualRenderer
      ?.getViewabilityTracker?.()
      ?.updateOffset?.(0, true, 0);
    // @ts-ignore
    clearTimeout(ref.current?._processInitialOffsetTimeout);
    ref.current?.scrollToOffset(0, 0);
    y.setValue(0);
  }, [y, accountAddress]);

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
