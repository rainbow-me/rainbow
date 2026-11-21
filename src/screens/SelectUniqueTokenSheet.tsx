import React, { useCallback } from 'react';
import { Platform } from 'react-native';

import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { Box } from '@/design-system';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { useSelectableNftRows } from '@/features/nfts/data/selectableNftRowsStore';
import { NftAssetList } from '@/features/nfts/ui/NftAssetList';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { nftsActions } from '@/state/nfts/nfts';

import { SheetHandle } from '../components/sheet';

export function SelectUniqueTokenSheet() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.SELECT_UNIQUE_TOKEN_SHEET>>();
  const { goBack } = useNavigation();
  const rows = useSelectableNftRows();

  const handlePressNft = useCallback(
    (asset: UniqueAsset) => {
      params.onSelect?.(asset);
      goBack();
    },
    [goBack, params]
  );

  return (
    <Box
      background="body (Deprecated)"
      height="full"
      paddingTop={Platform.OS === 'android' ? undefined : '34px (Deprecated)'}
      {...(Platform.OS === 'android' && { borderTopRadius: 30 })}
    >
      <Box alignItems="center" justifyContent="center" paddingVertical="10px">
        <SheetHandle />
      </Box>
      <NftAssetList rows={rows} onPressNft={handlePressNft} type="select-nft" onEndReached={nftsActions.fetchNextPage} />
    </Box>
  );
}
