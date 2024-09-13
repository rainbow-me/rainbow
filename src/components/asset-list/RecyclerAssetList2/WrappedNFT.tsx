import React, { useCallback, useMemo } from 'react';
import { UniqueTokenCard } from '../../unique-token';
import { Box, BoxProps } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { useCollectible } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';

export default React.memo(function WrappedNFT({
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

  const assetCollectible = useCollectible(uniqueId, externalAddress);

  const asset = useMemo(
    () => ({
      ...assetCollectible,
    }),
    [assetCollectible]
  );

  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    // @ts-expect-error passed to an untyped JS component
    asset =>
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external: assetCollectible?.isExternal || false,
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
        type: 'unique_token',
      }),
    [assetCollectible?.isExternal, navigate]
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

  if (!nftsEnabled) return null;

  return (
    <Box flexGrow={1} justifyContent="center" testID={`wrapped-nft-${asset.name}`} {...placementProps}>
      <UniqueTokenCard item={asset} onPress={onPress || handleItemPress} />
    </Box>
  );
});
