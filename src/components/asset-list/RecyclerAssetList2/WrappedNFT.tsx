import React, { useCallback, useMemo } from 'react';

import { Box, type BoxProps } from '@/design-system';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { IS_TEST } from '@/env';
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
  const asset = useNftsStore(state => (uniqueId ? state.getNftByUniqueId(uniqueId) : state.getNft(collectionId, index)));

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

  const placementProps: BoxProps = useMemo(
    () =>
      placement === 'left'
        ? {
            alignItems: 'flex-start',
            paddingLeft: '19px (Deprecated)',
          }
        : {
            alignItems: 'flex-end',
            paddingRight: '19px (Deprecated)',
          },
    [placement]
  );

  if (!asset) return null;

  return (
    <Box
      flexGrow={1}
      justifyContent="center"
      testID={IS_TEST ? `wrapped-nft-${asset.name}` : undefined}
      alignItems={placementProps.alignItems}
      paddingRight={placementProps.paddingRight}
      paddingLeft={placementProps.paddingLeft}
    >
      <UniqueTokenCard item={asset} onPress={onPress || handleItemPress} />
    </Box>
  );
});

export default WrappedNFT;
