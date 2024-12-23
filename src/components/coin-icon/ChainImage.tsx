import React, { useMemo, forwardRef } from 'react';
import FastImage from 'react-native-fast-image';
import { ChainId } from '@/state/backendNetworks/types';
import styled from '@/styled-thing';
import { Centered } from '../layout';
import { position as positions } from '@/styles';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

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
  iconSize: number;
  badgeXPosition: number;
  badgeYPosition: number;
  position: 'absolute' | 'relative';
};

const ChainIconPositionWrapper = styled(Centered)(
  ({ iconSize, badgeXPosition, badgeYPosition, position }: ChainIconPositionWrapperProps) => ({
    bottom: position === 'relative' ? 0 : badgeYPosition,
    left: position === 'relative' ? 0 : badgeXPosition,
    ...positions.sizeAsObject(iconSize),
    elevation: 10,
    overflow: 'visible',
    position: position || 'absolute',
    zIndex: 10,
  })
);

type ChainImageProps = {
  chainId: ChainId | null | undefined;
  size?: number;
  position?: 'absolute' | 'relative';
  showBadge?: boolean;
  badgeXPosition?: number;
  badgeYPosition?: number;
};

export const ChainImage = forwardRef<React.ElementRef<typeof FastImage>, ChainImageProps>(
  ({ chainId, size = 20, showBadge = true, badgeXPosition = 0, badgeYPosition = 0, position = 'absolute' }, ref) => {
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
      <ChainIconPositionWrapper badgeXPosition={badgeXPosition} badgeYPosition={badgeYPosition} iconSize={iconSize} position={position}>
        <ChainIcon containerSize={containerSize} iconSize={iconSize} source={{ uri: badgeUrl }} ref={ref} />
      </ChainIconPositionWrapper>
    ) : (
      <FastImage
        // @ts-expect-error couldn't figure out how to type this ref to make ts happy
        ref={ref}
        key={`${chainId}-badge-${size}`}
        source={{ uri: badgeUrl }}
        style={{ borderRadius: size / 2, height: size, width: size }}
      />
    );
  }
);

ChainImage.displayName = 'ChainImage';
