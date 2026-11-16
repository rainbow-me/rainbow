import React from 'react';

import TokenFamilyHeader from '@/components/token-family/TokenFamilyHeader';
import useLatestCallback from '@/hooks/useLatestCallback';
import { openCollectionsActions } from '@/state/nfts/openCollectionsStore';
import { type ThemeContextProps } from '@/theme/ThemeContext';

import { type NFTFamilyExtraData } from './core/ViewTypes';

type Props = Omit<NFTFamilyExtraData, 'type'> & { theme: ThemeContextProps };

export const WrappedTokenFamilyHeader = React.memo(function WrappedTokenFamilyHeader({
  collectionKey,
  isOpen,
  name,
  total,
  image,
  theme,
}: Props) {
  const handleToggle = useLatestCallback(() => openCollectionsActions.toggleCollection(collectionKey));

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
