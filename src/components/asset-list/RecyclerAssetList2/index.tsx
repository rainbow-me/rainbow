import React, { useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useMemoOne } from 'use-memo-one';
import { RecyclerAssetListScrollPositionContext } from './core/Contexts';
import RawMemoRecyclerAssetList from './core/RawRecyclerList';
import { StickyHeaderManager } from './core/StickyHeaders';
import useMemoBriefSectionData from './core/useMemoBriefSectionData';
import { UniqueAsset } from '@rainbow-me/entities';

export type AssetListType = 'wallet' | 'ens-profile' | 'select-nft';

function RecyclerAssetList({
  disablePullDownToRefresh,
  externalAddress,
  onPressUniqueToken,
  type = 'wallet',
  walletBriefSectionsData,
}: {
  disablePullDownToRefresh?: boolean;
  /** An "external address" is an address that is not the current account address. */
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
  type?: AssetListType;
  walletBriefSectionsData: any[];
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
    () => ({ additionalData, externalAddress, onPressUniqueToken }),
    [additionalData, externalAddress, onPressUniqueToken]
  );

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      <StickyHeaderManager>
        <RawMemoRecyclerAssetList
          briefSectionsData={briefSectionsData}
          disablePullDownToRefresh={!!disablePullDownToRefresh}
          extendedState={extendedState}
          type={type}
        />
      </StickyHeaderManager>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);
