import React, { useCallback, useMemo } from 'react';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
import { UniqueTokenCard } from '../../unique-token';
import { Box, BoxProps } from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';
import { useCollectible } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

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
  const assetCollectible = useCollectible(
    { uniqueId },
    undefined,
    externalAddress
  );

  const asset = useMemo(
    () => ({
      ...assetCollectible,
      ...(IS_TESTING === 'true'
        ? { image_original_url: null, image_preview_url: null, image_url: null }
        : {}),
    }),
    [assetCollectible]
  );

  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
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
          paddingLeft: '19px',
        }
      : {
          alignItems: 'flex-end',
          paddingRight: '19px',
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
