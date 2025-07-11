import React from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useLatestCallback } from '@/hooks';
import { ThemeContextProps } from '@/theme';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { useNftsStore } from '@/state/nfts/nfts';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';

type Props = {
  name: string;
  total?: number;
  image?: string;
  theme: ThemeContextProps;
  testID?: string;
  uid: string;
};

export default React.memo(function WrappedTokenFamilyHeader({ name, total, image, theme, testID, uid }: Props) {
  const { nfts_enabled } = useRemoteConfig();
  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;

  const isOpen = useOpenCollectionsStore(state => state.isCollectionOpen(uid));

  const handleToggle = useLatestCallback(() => {
    useOpenCollectionsStore.getState().toggleCollection(uid);

    // from closed -> open, let's fetch the inner nft metadata
    if (!isOpen) {
      useNftsStore.getState().fetchNftCollection(uid.toLowerCase());
    }
  });

  if (!nftsEnabled) return null;

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
