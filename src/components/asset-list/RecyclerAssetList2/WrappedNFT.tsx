import React, { useCallback } from 'react';
import { UniqueTokenCard } from '../../unique-token';
import { Box, BoxProps } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { useNftsStore } from '@/state/nfts/nfts';

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
