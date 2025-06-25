import React from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useLatestCallback } from '@/hooks';
import { ThemeContextProps } from '@/theme';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { useNftsStore } from '@/state/nfts/nfts';
import { time } from '@/utils';
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

  const isOpen = useOpenCollectionsStore(state => state.isCollectionOpen(name));

  const handleToggle = useLatestCallback(() => {
    useOpenCollectionsStore.getState().toggleCollection(name);

    // from closed -> open, let's fetch the inner nft metadata
    if (!isOpen) {
      useNftsStore.getState().fetch(
        {
          collectionId: uid.toLowerCase(),
        },
        // we handle pruning / stale time manually, so we don't need to ever refetch the collection data
        { staleTime: time.infinity }
      );
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
