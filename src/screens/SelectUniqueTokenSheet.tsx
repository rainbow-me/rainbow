import { useNavigation, useRoute } from '@react-navigation/core';
import React, { useContext, useEffect, useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useMemoOne } from 'use-memo-one';
import { RecyclerAssetListScrollPositionContext } from '../components/asset-list/RecyclerAssetList2/core/Contexts';
import RawMemoRecyclerAssetList from '../components/asset-list/RecyclerAssetList2/core/RawRecyclerList';
import { StickyHeaderManager } from '../components/asset-list/RecyclerAssetList2/core/StickyHeaders';
import useMemoBriefSectionData from '../components/asset-list/RecyclerAssetList2/core/useMemoBriefSectionData';
import { SheetHandle } from '../components/sheet';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import { Box } from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';

export default function SelectUniqueTokenSheet() {
  const { params } = useRoute();
  const { goBack } = useNavigation();
  const { layout } = useContext(ModalContext) || {};

  useEffect(() => {
    setTimeout(() => layout?.(), 300);
  }, [layout]);

  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData({ type: 'select-nft' });
  const position = useMemoOne(() => new RNAnimated.Value(0), []);

  const extendedState = useMemo(
    () => ({
      additionalData,
      onPressUniqueToken: (asset: UniqueAsset) => {
        /* @ts-expect-error No types for `param` yet */
        params.onSelect?.(asset);
        goBack();
      },
    }),
    [additionalData, goBack, params]
  );

  return (
    <Box background="body" height="full" paddingTop="34px">
      <Box alignItems="center" justifyContent="center" paddingVertical="10px">
        {/* @ts-expect-error JavaScript component */}
        <SheetHandle />
      </Box>
      <RecyclerAssetListScrollPositionContext.Provider value={position}>
        <StickyHeaderManager>
          <RawMemoRecyclerAssetList
            briefSectionsData={briefSectionsData}
            extendedState={extendedState}
            type="select-nft"
          />
        </StickyHeaderManager>
      </RecyclerAssetListScrollPositionContext.Provider>
    </Box>
  );
}
