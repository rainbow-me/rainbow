import React, { useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useMemoOne } from 'use-memo-one';
import {
  RecyclerAssetListContext,
  RecyclerAssetListScrollPositionContext,
} from './core/Contexts';
import RawMemoRecyclerAssetList from './core/RawRecyclerList';
import { StickyHeaderManager } from './core/StickyHeaders';
import useMemoBriefSectionData from './core/useMemoBriefSectionData';

function RecyclerAssetList({ showcase = false }: { showcase?: boolean }) {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData({ showcase });

  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  const value = useMemo(() => ({ additionalData }), [additionalData]);

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      <RecyclerAssetListContext.Provider value={value}>
        <StickyHeaderManager>
          <RawMemoRecyclerAssetList
            briefSectionsData={briefSectionsData}
            showcase={showcase}
          />
        </StickyHeaderManager>
      </RecyclerAssetListContext.Provider>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);
