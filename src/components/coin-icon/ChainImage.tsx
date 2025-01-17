import { FasterImageView } from '@candlefinance/faster-image';
import { useColorMode } from '@/design-system';
import React, { memo, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { BLANK_BASE64_PIXEL } from '../DappBrowser/constants';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '../images/ImgixImage';

type ChainImageProps = {
  badgeXPosition?: number;
  badgeYPosition?: number;
  chainId: ChainId | null | undefined;
  position?: 'absolute' | 'relative';
  showBadge?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export const ChainImage = memo(function ChainImage({
  badgeXPosition = 0,
  badgeYPosition = 0,
  chainId,
  position = 'absolute',
  showBadge = true,
  size = 20,
  style,
}: ChainImageProps) {
  const { isDarkMode } = useColorMode();
  const { containerStyle, iconStyle } = useMemo(
    () => getChainBadgeStyles({ badgeXPosition, badgeYPosition, isDarkMode, position, size }),
    [badgeXPosition, badgeYPosition, isDarkMode, position, size]
  );

  if (!chainId || !showBadge) return null;

  const badgeUrl = useBackendNetworksStore.getState().getChainsBadge()[chainId];
  if (!badgeUrl) return null;

  return (
    <View style={[style, containerStyle]}>
      <FasterImageView
        source={{
          ...DEFAULT_FASTER_IMAGE_CONFIG,
          base64Placeholder: BLANK_BASE64_PIXEL,
          url: badgeUrl,
        }}
        style={iconStyle}
      />
    </View>
  );
});

type IconLayout = {
  iconSize: number;
  iconXPosition: number;
  iconYPosition: number;
};

function getIconLayout(size: number): IconLayout {
  const iconSize = size * 1.6;
  const sizeDiff = iconSize - size;
  return {
    iconSize,
    iconXPosition: -(sizeDiff / 2),
    iconYPosition: -(sizeDiff / 3),
  };
}

type ContainerStyles = {
  borderRadius: number | undefined; // ⚠️ Temporary until we add dark mode badges
  bottom: number | undefined;
  height: number;
  left: number | undefined;
  overflow: 'hidden' | undefined; // ⚠️ Temporary until we add dark mode badges
  position: 'absolute' | 'relative';
  width: number;
};
type ImageStyles = {
  height: number;
  left: number;
  position: 'absolute';
  top: number;
  width: number;
};

export function getChainBadgeStyles({
  badgeXPosition = 0,
  badgeYPosition = 0,
  isDarkMode,
  position,
  size,
}: {
  badgeXPosition: number;
  badgeYPosition: number;
  isDarkMode: boolean; // ⚠️ Temporary until we add dark mode badges
  position: 'absolute' | 'relative';
  size: number;
}): { containerStyle: ContainerStyles; iconStyle: ImageStyles } {
  const { iconSize, iconXPosition, iconYPosition } = getIconLayout(size);
  return {
    containerStyle: {
      borderRadius: isDarkMode ? size / 2 : undefined,
      bottom: badgeYPosition,
      height: size,
      left: badgeXPosition,
      overflow: isDarkMode ? 'hidden' : undefined,
      position,
      width: size,
    },
    iconStyle: {
      height: iconSize,
      left: iconXPosition,
      position: 'absolute',
      top: iconYPosition,
      width: iconSize,
    },
  };
}
