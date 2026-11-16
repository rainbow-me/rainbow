import React, { useCallback } from 'react';

import { Box } from '@/design-system';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { IS_TEST } from '@/env';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import { UniqueTokenCard } from '../../unique-token';

export const WrappedNFT = React.memo(function WrappedNFT({
  asset,
  external,
  onPress,
  placement,
}: {
  asset: UniqueAsset | null;
  external?: boolean;
  onPress?: (asset: UniqueAsset) => void;
  placement: 'left' | 'right';
}) {
  const handleItemPress = useCallback(
    (asset: UniqueAsset) =>
      Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        external,
        cornerRadius: 'device',
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
        type: 'unique_token',
      }),
    [external]
  );

  if (!asset) return null;

  return (
    <Box
      flexGrow={1}
      justifyContent="center"
      testID={IS_TEST ? `wrapped-nft-${asset.name}` : undefined}
      alignItems={placement === 'left' ? 'flex-start' : 'flex-end'}
      paddingRight={placement === 'right' ? '19px (Deprecated)' : undefined}
      paddingLeft={placement === 'left' ? '19px (Deprecated)' : undefined}
    >
      <UniqueTokenCard item={asset} onPress={onPress || handleItemPress} />
    </Box>
  );
});
