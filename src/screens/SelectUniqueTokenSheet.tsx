import { useNavigation, useRoute } from '@react-navigation/core';
import React, { useContext, useEffect, useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useMemoOne } from 'use-memo-one';
import {
  RecyclerAssetListContext,
  RecyclerAssetListScrollPositionContext,
} from '../components/asset-list/RecyclerAssetList2/core/Contexts';
import RawMemoRecyclerAssetList from '../components/asset-list/RecyclerAssetList2/core/RawRecyclerList';
import { StickyHeaderManager } from '../components/asset-list/RecyclerAssetList2/core/StickyHeaders';
import useMemoBriefSectionData from '../components/asset-list/RecyclerAssetList2/core/useMemoBriefSectionData';
import { SheetHandle } from '../components/sheet';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import { Box, Inset, Text } from '@rainbow-me/design-system';

export default function ShowcaseScreen() {
  const { params } = useRoute();
  const { goBack } = useNavigation();
  const { layout } = useContext(ModalContext) || {};

  useEffect(() => {
    setTimeout(() => layout?.(), 300);
  }, [layout]);

  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData();
  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  const nftBriefSectionsData = useMemo(
    () =>
      briefSectionsData
        .map(item =>
          item.type === 'NFT_SPACE_AFTER' ||
          item.type === 'NFT' ||
          item.type === 'FAMILY_HEADER'
            ? item
            : undefined
        )
        .filter(x => x),
    [briefSectionsData]
  );

  return (
    <Box background="body" height="full" paddingTop="34px">
      <Box alignItems="center" justifyContent="center" paddingVertical="10px">
        <SheetHandle />
      </Box>
      <RecyclerAssetListScrollPositionContext.Provider value={position}>
        <RecyclerAssetListContext.Provider
          value={{
            additionalData,
            onPressUniqueToken: asset => {
              params?.onSelect?.(asset);
              goBack();
            },
          }}
        >
          <StickyHeaderManager>
            <RawMemoRecyclerAssetList
              briefSectionsData={nftBriefSectionsData}
            />
          </StickyHeaderManager>
        </RecyclerAssetListContext.Provider>
      </RecyclerAssetListScrollPositionContext.Provider>
    </Box>
  );
}
