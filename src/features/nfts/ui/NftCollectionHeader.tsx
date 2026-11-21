import { memo, useCallback } from 'react';

import { type NftCollectionHeaderData } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import TokenFamilyHeader from '@/components/token-family/TokenFamilyHeader';
import { nftsActions } from '@/state/nfts/nfts';
import { type ThemeContextProps } from '@/theme/ThemeContext';

type Props = Omit<NftCollectionHeaderData, 'type'> & {
  collectionId: string;
  onToggleCollection?: (id: string) => void;
  theme: ThemeContextProps;
};

/** Uses account expansion unless the displaying list owns its own toggle. */
export const NftCollectionHeader = memo(function NftCollectionHeader({
  collectionId,
  isOpen,
  name,
  onToggleCollection = nftsActions.toggleCollection,
  total,
  image,
  theme,
}: Props) {
  const handleToggle = useCallback(() => onToggleCollection(collectionId), [collectionId, onToggleCollection]);

  return (
    <TokenFamilyHeader
      childrenAmount={total}
      familyImage={image}
      isOpen={isOpen}
      onPress={handleToggle}
      testID={`token-family-header-${name}`}
      theme={theme}
      title={name}
    />
  );
});
