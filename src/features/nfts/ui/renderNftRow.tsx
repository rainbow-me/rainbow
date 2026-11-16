import React from 'react';

import { CellType, type NftCell } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { WrappedNFT } from '@/components/asset-list/RecyclerAssetList2/WrappedNFT';
import { WrappedTokenFamilyHeader } from '@/components/asset-list/RecyclerAssetList2/WrappedTokenFamilyHeader';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { type ThemeContextProps } from '@/theme/ThemeContext';

/**
 * Renders a prepared NFT row; picker actions and external addresses belong to its list.
 */
export function renderNftRow(
  data: NftCell,
  theme: ThemeContextProps,
  onPress?: (asset: UniqueAsset) => void,
  externalAddress?: string
): React.ReactElement | null {
  switch (data.type) {
    case CellType.FAMILY_HEADER:
      return (
        <WrappedTokenFamilyHeader
          collectionKey={data.collectionKey}
          image={data.image}
          isOpen={data.isOpen}
          name={data.name}
          theme={theme}
          total={data.total}
        />
      );
    case CellType.NFT:
      return (
        <WrappedNFT asset={data.asset} external={!!externalAddress} onPress={onPress} placement={data.index % 2 === 0 ? 'left' : 'right'} />
      );
    case CellType.NFT_SPACE_AFTER:
      return null;
  }
}
