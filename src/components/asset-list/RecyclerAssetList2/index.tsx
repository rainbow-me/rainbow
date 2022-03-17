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

export type AssetListType = 'wallet' | 'ens-profile';

function RecyclerAssetList({
  address,
  type = 'wallet',
}: {
  address?: string;
  type?: AssetListType;
}) {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData({ address, type });

  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  const value = useMemo(() => ({ additionalData, address }), [
    additionalData,
    address,
  ]);

  if (briefSectionsData.length === 0) return null;
  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      <RecyclerAssetListContext.Provider value={value}>
        <StickyHeaderManager>
          <RawMemoRecyclerAssetList
            briefSectionsData={briefSectionsData}
            type={type}
          />
        </StickyHeaderManager>
      </RecyclerAssetListContext.Provider>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);
