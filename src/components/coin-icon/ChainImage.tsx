import React, { useMemo } from 'react';
import { ChainId } from '@/state/backendNetworks/types';
import FastImage from 'react-native-fast-image';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import styled from '@/styled-thing';
import { Centered } from '../layout';
import { position as positions } from '@/styles';

type ChainIconProps = {
  containerSize: number;
  iconSize: number;
};

const ChainIcon = styled(FastImage)(({ containerSize, iconSize }: ChainIconProps) => ({
  height: containerSize,
  top: iconSize / 5,
  width: containerSize,
}));

type ChainIconPositionWrapperProps = {
  marginBottom: number;
  iconSize: number;
  badgeXPosition: number;
  badgeYPosition: number;
  position: 'absolute' | 'relative';
};

const ChainIconPositionWrapper = styled(Centered)(
  ({ marginBottom, iconSize, badgeXPosition, badgeYPosition, position }: ChainIconPositionWrapperProps) => ({
    bottom: position === 'relative' ? 0 : badgeYPosition,
    left: position === 'relative' ? 0 : badgeXPosition,
    ...positions.sizeAsObject(iconSize),
    elevation: 10,
    marginBottom,
    overflow: 'visible',
    position: position || 'absolute',
    zIndex: 10,
  })
);

export function ChainImage({
  chainId,
  size = 20,
  showBadge = true,
  badgeXPosition = 0,
  badgeYPosition = 0,
  position = 'absolute',
}: {
  chainId: ChainId | null | undefined;
  size?: number;
  position?: 'absolute' | 'relative';
  showBadge?: boolean;
  badgeXPosition?: number;
  badgeYPosition?: number;
}) {
  const { containerSize, iconSize } = useMemo(
    () => ({
      containerSize: size,
      iconSize: size,
    }),
    [size]
  );

  if (!chainId) return null;

  const badgeUrl = useBackendNetworksStore.getState().getChainsBadge()[chainId];

  if (!badgeUrl || !showBadge) return null;

  return badgeXPosition || badgeYPosition ? (
    <ChainIconPositionWrapper
      badgeXPosition={badgeXPosition}
      badgeYPosition={badgeYPosition}
      iconSize={iconSize}
      marginBottom={0}
      position={position}
    >
      <ChainIcon containerSize={containerSize} iconSize={iconSize} source={{ uri: badgeUrl }} />
    </ChainIconPositionWrapper>
  ) : (
    <FastImage key={`${chainId}-badge-${size}`} source={{ uri: badgeUrl }} style={{ borderRadius: size / 2, height: size, width: size }} />
  );
}
