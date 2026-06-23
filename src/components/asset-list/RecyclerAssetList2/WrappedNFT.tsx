import React, { useCallback } from 'react';

import { Box, type BoxProps } from '@/design-system';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { NFTS_ENABLED } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useNftsStore } from '@/state/nfts/nfts';

import { UniqueTokenCard } from '../../unique-token';

export const WrappedNFT = React.memo(function WrappedNFT({
  onPress,
  collectionId,
  placement,
  index,
  uniqueId,
}: {
  onPress?: (asset: UniqueAsset) => void;
  collectionId: string;
  placement: 'left' | 'right';
  index: number;
  uniqueId?: string;
}) {
  const { nfts_enabled } = useRemoteConfig();
  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;

  const asset = uniqueId
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useNftsStore(state => state.getNftByUniqueId(collectionId, uniqueId))
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useNftsStore(state => state.getNft(collectionId, index));

  const handleItemPress = useCallback(
    (asset: UniqueAsset) =>
      Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
        type: 'unique_token',
      }),
    []
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

export default WrappedNFT;
