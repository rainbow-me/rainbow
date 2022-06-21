import React, { useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useMemoOne } from 'use-memo-one';
import { RecyclerAssetListScrollPositionContext } from './core/Contexts';
import RawMemoRecyclerAssetList from './core/RawRecyclerList';
import { StickyHeaderManager } from './core/StickyHeaders';
import useMemoBriefSectionData from './core/useMemoBriefSectionData';

export type AssetListType = 'wallet' | 'ens-profile' | 'select-nft';

function RecyclerAssetList({
  walletBriefSectionsData,
  externalAddress,
  type = 'wallet',
}: {
  walletBriefSectionsData: any[];
  /** An "external address" is an address that is not the current account address. */
  externalAddress?: string;
  type?: AssetListType;
}) {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData({
    briefSectionsData: walletBriefSectionsData,
    externalAddress,
    type,
  });

  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  const extendedState = useMemo(
    () => ({
      additionalData,
      externalAddress,
    }),
    [additionalData, externalAddress]
  );

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      <StickyHeaderManager>
        <RawMemoRecyclerAssetList
          briefSectionsData={briefSectionsData}
          extendedState={extendedState}
          type={type}
        />
      </StickyHeaderManager>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);
