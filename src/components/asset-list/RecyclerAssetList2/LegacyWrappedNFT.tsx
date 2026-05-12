import React, { useCallback } from 'react';

import { NFTS_ENABLED } from '@/config/experimental';
import useExperimentalFlag from '@/config/experimentalHooks';
import { Box, type BoxProps } from '@/design-system';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useCollectible from '@/hooks/useCollectible';
import { useRemoteConfig } from '@/model/remoteConfig';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import { UniqueTokenCard } from '../../unique-token';

export default React.memo(function LegacyWrappedNFT({
  onPress,
  uniqueId,
  placement,
  externalAddress,
}: {
  onPress?: (asset: UniqueAsset) => void;
  uniqueId: string;
  placement: 'left' | 'right';
  externalAddress?: string;
}) {
  const { nfts_enabled } = useRemoteConfig();
  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;

  const asset = useCollectible(uniqueId, externalAddress);

  const handleItemPress = useCallback(
    (asset: UniqueAsset) =>
      Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external: !!externalAddress || false,
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
        type: 'unique_token',
      }),
    [externalAddress]
  );

  const placementProps: BoxProps =
    placement === 'left'
      ? {
          alignItems: 'flex-start',
          paddingLeft: '19px (Deprecated)',
        }
      : {
          alignItems: 'flex-end',
          paddingRight: '19px (Deprecated)',
        };

  if (!nftsEnabled || !asset) return null;

  return (
    <Box flexGrow={1} justifyContent="center" testID={`wrapped-nft-${asset.name}`} {...placementProps}>
      <UniqueTokenCard item={asset} onPress={onPress || handleItemPress} />
    </Box>
  );
});
