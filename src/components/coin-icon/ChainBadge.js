import React from 'react';
import FastImage from 'react-native-fast-image';
import { Centered } from '../layout';
import styled from '@/styled-thing';
import { position as positions } from '@/styles';
import { ChainBadgeSizeConfigs } from '@/components/coin-icon/ChainBadgeSizeConfigs';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const ChainIcon = styled(FastImage)({
  height: ({ containerSize }) => containerSize,
  top: ({ iconSize }) => iconSize / 5,
  width: ({ containerSize }) => containerSize,
});

const IndicatorIconContainer = styled(Centered)(({ marginBottom, iconSize, badgeXPosition, badgeYPosition, position }) => ({
  bottom: position === 'relative' ? 0 : badgeYPosition,
  left: position === 'relative' ? 0 : badgeXPosition,
  ...positions.sizeAsObject(iconSize),
  elevation: 10,
  marginBottom,
  overflow: 'visible',
  position: position || 'absolute',
  zIndex: 10,
}));

export default function ChainBadge({
  chainId,
  badgeXPosition = -7,
  badgeYPosition = 0,
  marginBottom = 0,
  position = 'absolute',
  size = 'small',
  showBadge = true,
}) {
  const { containerSize, iconSize } = ChainBadgeSizeConfigs[size];
  const chainBadge = useBackendNetworksStore.getState().getChainsBadge()[chainId];
  if (!chainBadge || !showBadge) return null;

  return (
    <IndicatorIconContainer
      badgeXPosition={badgeXPosition}
      badgeYPosition={badgeYPosition}
      iconSize={iconSize}
      marginBottom={marginBottom}
      position={position}
    >
      <ChainIcon containerSize={containerSize} iconSize={iconSize} source={{ uri: chainBadge }} />
    </IndicatorIconContainer>
  );
}
