import React, { memo, useMemo } from 'react';
import { Image, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { FasterImageView } from '@candlefinance/faster-image';

import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { useColorMode } from '@/design-system';
import { SOLANA_NETWORK_BADGE } from '@/features/solana/constants/networkAssets';
import { SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';
import { TRANSPARENT_PIXEL_BASE64 } from '@/framework/ui/utils/transparentPixelBase64';

import { useBackendNetworksStore } from '../stores/backendNetworksStore';
import { type SupportedChainId } from '../types/supportedChainId';

type ChainImageProps = {
  badgeSource?: ImageSourcePropType;
  badgeXPosition?: number;
  badgeYPosition?: number;
  chainId: SupportedChainId | null | undefined;
  position?: 'absolute' | 'relative';
  showBadge?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export const ChainImage = memo(function ChainImage({
  chainId,
  badgeSource = chainId === SOLANA_CHAIN_ID ? SOLANA_NETWORK_BADGE : undefined,
  badgeXPosition = 0,
  badgeYPosition = 0,
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

  if ((!chainId && !badgeSource) || !showBadge) return null;

  const badgeUrl =
    (chainId && chainId !== SOLANA_CHAIN_ID ? useBackendNetworksStore.getState().getChainsBadge()[chainId] : undefined) ?? '';
  if (!badgeUrl && !badgeSource) return null;

  return (
    <View style={[style, containerStyle]}>
      {badgeSource ? (
        <Image source={badgeSource} style={iconStyle} />
      ) : (
        <FasterImageView
          source={{
            ...DEFAULT_FASTER_IMAGE_CONFIG,
            base64Placeholder: TRANSPARENT_PIXEL_BASE64,
            url: badgeUrl,
          }}
          style={iconStyle}
        />
      )}
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
