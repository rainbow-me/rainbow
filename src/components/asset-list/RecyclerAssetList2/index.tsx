import React from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useMemoOne } from 'use-memo-one';
import {
  RecyclerAssetListContext,
  RecyclerAssetListScrollPositionContext,
} from './core/Contexts';
import RawMemoRecyclerAssetList from './core/RawRecyclerList';
import { StickyHeaderManager } from './core/StickyHeaders';
import useMemoBriefSectionData from './core/useMemoBriefSectionData';

function RecyclerAssetList() {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData();

  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      <RecyclerAssetListContext.Provider value={additionalData}>
        <StickyHeaderManager>
          <RawMemoRecyclerAssetList briefSectionsData={briefSectionsData} />
        </StickyHeaderManager>
      </RecyclerAssetListContext.Provider>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);
