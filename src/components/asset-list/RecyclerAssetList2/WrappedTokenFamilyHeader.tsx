import React, { useEffect } from 'react';
import { TokenFamilyHeader } from '../../token-family';
import { useLatestCallback, useOpenFamilies, usePrevious } from '@/hooks';
import { ThemeContextProps } from '@/theme';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { useNftsStore } from '@/state/nfts/nfts';

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
  const previousOpen = usePrevious(isFamilyOpen);

  const handleToggle = useLatestCallback(() =>
    updateOpenFamilies({
      [name]: !isFamilyOpen,
    })
  );

  useEffect(() => {
    if (isFamilyOpen && !previousOpen) {
      useNftsStore.getState().fetch(
        { collectionId: uid },
        {
          force: true,
        }
      );
    }
  }, [isFamilyOpen, previousOpen, uid]);

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
