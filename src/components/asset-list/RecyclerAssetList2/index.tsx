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

export type AssetListType = 'wallet' | 'ens-profile' | 'select-nft';

function RecyclerAssetList({
  externalAddress,
  type = 'wallet',
}: {
  /** An "external address" is an address that is not the current account address. */
  externalAddress?: string;
  type?: AssetListType;
}) {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData({ externalAddress, type });

  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  const value = useMemo(() => ({ additionalData, externalAddress }), [
    additionalData,
    externalAddress,
  ]);

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
