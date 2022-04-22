import React, { useCallback } from 'react';
import { UniqueTokenCard } from '../../unique-token';
import { Box, BoxProps } from '@rainbow-me/design-system';
import { useCollectible } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default React.memo(function WrappedNFT({
  uniqueId,
  placement,
}: {
  uniqueId: string;
  placement: 'left' | 'right';
}) {
  const asset = useCollectible({ uniqueId });
  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    asset =>
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external: false,
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
          paddingLeft: '19px',
        }
      : {
          alignItems: 'flex-end',
          paddingRight: '19px',
        };

  return (
    <Box flexGrow={1} justifyContent="center" {...placementProps}>
      <UniqueTokenCard item={asset} onPress={handleItemPress} />
    </Box>
  );
});
