import React from 'react';

import useLatestCallback from '@/hooks/useLatestCallback';
import { nftsStoreActions } from '@/state/nfts/nfts';
import { openCollectionsActions, useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { type ThemeContextProps } from '@/theme/ThemeContext';

import { TokenFamilyHeader } from '../../token-family';

type Props = {
  name: string;
  total?: number;
  image?: string;
  theme: ThemeContextProps;
  testID?: string;
  uid: string;
};

export default React.memo(function WrappedTokenFamilyHeader({ name, total, image, theme, testID, uid }: Props) {
  const isOpen = useOpenCollectionsStore(state => state.isCollectionOpen(uid));

  const handleToggle = useLatestCallback(() => {
    const newIsOpen = openCollectionsActions.toggleCollection(uid);

    // from closed -> open, let's fetch the inner nft metadata
    if (newIsOpen) {
      nftsStoreActions.fetchNftCollection(uid.toLowerCase());
    }
  });

  return (
    <TokenFamilyHeader
      childrenAmount={total}
      familyImage={image}
      isOpen={isOpen}
      onPress={handleToggle}
      testID={testID}
      theme={theme}
      title={name}
    />
  );
});
