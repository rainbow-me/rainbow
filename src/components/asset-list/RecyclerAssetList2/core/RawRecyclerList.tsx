import React from 'react';
import { DataProvider, RecyclerListView } from 'recyclerlistview';
import { useMemoOne } from 'use-memo-one';
import ExternalScrollViewWithRef from './ExternalScrollView';
import rowRenderer from './RowRenderer';
import { BaseCellType } from './ViewTypes';
import getLayoutProvider from './getLayoutProvider';

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

  return (
    <RecyclerListView
      dataProvider={currentDataProvider}
      // @ts-ignore
      externalScrollView={ExternalScrollViewWithRef}
      layoutProvider={layoutProvider}
      renderAheadOffset={2000}
      // @ts-ignore
      rowRenderer={rowRenderer}
    />
  );
});

export default RawMemoRecyclerAssetList;
