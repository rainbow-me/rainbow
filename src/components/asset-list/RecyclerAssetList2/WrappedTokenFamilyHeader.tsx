import React from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useLatestCallback, useOpenFamilies } from '@/hooks';
import { ThemeContextProps } from '@/theme';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { useNftsStore } from '@/state/nfts/nfts';
import { time } from '@/utils';

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

  const { openFamilies, updateOpenFamilies } = useOpenFamilies();
  const isFamilyOpen = openFamilies[name];

  const handleToggle = useLatestCallback(() => {
    updateOpenFamilies({
      [name]: !isFamilyOpen,
    });

    const normalizedCollectionId = uid.toLowerCase();
    const { openCollections } = useNftsStore.getState();

    // update the state with the new open collections
    useNftsStore.setState({
      openCollections,
    });

    if (!isFamilyOpen && !openCollections.has(normalizedCollectionId)) {
      openCollections.add(normalizedCollectionId);

      useNftsStore.getState().fetch(
        {
          collectionId: normalizedCollectionId,
        },
        // we handle pruning / stale time manually, so we don't need to ever refetch the collection data
        { staleTime: time.infinity }
      );
    } else if (isFamilyOpen && openCollections.has(normalizedCollectionId)) {
      openCollections.delete(normalizedCollectionId);
    }
  });

  if (!nftsEnabled) return null;

  return (
    <TokenFamilyHeader
      childrenAmount={total}
      familyImage={image}
      isOpen={isFamilyOpen}
      onPress={handleToggle}
      testID={testID}
      theme={theme}
      title={name}
    />
  );
});
