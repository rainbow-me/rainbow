import React from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useMemoOne } from 'use-memo-one';
import { RecyclerAssetListScrollPositionContext } from './core/Contexts';
import RawMemoRecyclerAssetList from './core/RawRecyclerList';
import { StickyHeaderManager } from './core/StickyHeaders';
import useMemoBriefSectionData from './core/useMemoBriefSectionData';

function RecyclerAssetList({
  walletBriefSectionsData,
}: {
  walletBriefSectionsData: any[];
}) {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData(walletBriefSectionsData);

  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      <StickyHeaderManager>
        <RawMemoRecyclerAssetList
          additionalData={additionalData}
          briefSectionsData={briefSectionsData}
        />
      </StickyHeaderManager>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);
