import React from 'react';

import { CellType, type NftCell } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { WrappedNFT } from '@/components/asset-list/RecyclerAssetList2/WrappedNFT';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { type ThemeContextProps } from '@/theme/ThemeContext';

import { NftCollectionHeader } from './NftCollectionHeader';

/** A list can override wallet taps or present an NFT from an external profile. */
export type NftRowInteractions = {
  external: boolean;
  onPressNft?: (asset: UniqueAsset) => void;
  onToggleCollection?: (id: string) => void;
};

/**
 * Renders a prepared NFT row with the actions of the list displaying it.
 */
export function renderNftRow(data: NftCell, theme: ThemeContextProps, interactions?: NftRowInteractions): React.ReactElement | null {
  switch (data.type) {
    case CellType.FAMILY_HEADER:
      return (
        <NftCollectionHeader
          collectionId={data.uid}
          image={data.image}
          isOpen={data.isOpen}
          name={data.name}
          onToggleCollection={interactions?.onToggleCollection}
          theme={theme}
          total={data.total}
        />
      );
    case CellType.NFT:
      return (
        <WrappedNFT
          asset={data.asset}
          external={interactions?.external ?? false}
          onPress={interactions?.onPressNft}
          placement={data.index % 2 === 0 ? 'left' : 'right'}
        />
      );
    case CellType.NFT_SPACE_AFTER:
      return null;
  }
}
