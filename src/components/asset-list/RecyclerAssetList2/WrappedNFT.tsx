import React, { useCallback } from 'react';
import { UniqueTokenCard } from '../../unique-token';
import { Box, BoxProps } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { useCollectible } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

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
  const asset = useCollectible({ uniqueId }, externalAddress);

  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    asset =>
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external: asset?.isExternal || false,
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
        type: 'unique_token',
      }),
    [navigate]
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
  return (
    <Box
      flexGrow={1}
      justifyContent="center"
      testID={`wrapped-nft-${asset.name}`}
      {...placementProps}
    >
      <UniqueTokenCard item={asset} onPress={onPress || handleItemPress} />
    </Box>
  );
});
