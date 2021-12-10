import React from 'react';
import { UniqueTokenCard } from '../../unique-token';
import { Box } from '@rainbow-me/design-system';
import { useAsset, useWallets } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function WrappedNFT({ uniqueId, placement }) {
  const asset = useAsset({ type: 'nft', uniqueId });
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    (asset, lowResUrl) =>
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external: false,
        isReadOnlyWallet,
        lowResUrl,
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
        type: 'unique_token',
      }),
    [isReadOnlyWallet, navigate]
  );

  const placementProps =
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
}
