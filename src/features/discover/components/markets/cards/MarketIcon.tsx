import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import ImgixImage from '@/components/images/ImgixImage';
import { Border, Text } from '@/design-system';
import { type TextSize } from '@/design-system/components/Text/Text';
import { LeverageBadge } from '@/features/perps/components/LeverageBadge';

const DEFAULT_BORDER_WIDTH = 8 / 3;
const DEFAULT_IMAGE_BORDER_GAP = 4 / 3;
const DEFAULT_BADGE_POSITION = 'top-left';
const BADGE_OFFSET = 4;

type MarketIconProps = {
  accentColor: string;
  borderColor: string;
  fallbackText: string;
  fallbackTextSize: TextSize;
  iconUrl: string | undefined;
  size: number;
  imageBorderGap?: number;
  badgePosition?: 'top-left' | 'top-right';
  leverage: number | undefined;
  badgeBorderColor: string;
  badgeShadowColor: string;
  badgeShadowOpacity: number;
  badgeTextColor: string;
};

export const MarketIcon = memo(function MarketIcon({
  accentColor,
  borderColor,
  fallbackText,
  fallbackTextSize,
  iconUrl,
  size,
  imageBorderGap = DEFAULT_IMAGE_BORDER_GAP,
  badgePosition = DEFAULT_BADGE_POSITION,
  leverage,
  badgeBorderColor,
  badgeShadowColor,
  badgeShadowOpacity,
  badgeTextColor,
}: MarketIconProps) {
  const borderWidth = DEFAULT_BORDER_WIDTH;
  const imageSize = size - borderWidth * 2 - imageBorderGap * 2;
  const containerStyle = useMemo(() => ({ height: size, width: size }), [size]);
  const imageStyle = useMemo(() => ({ borderRadius: imageSize / 2, height: imageSize, width: imageSize }), [imageSize]);
  const badgePositionStyle = badgePosition === 'top-left' ? styles.badgeTopLeft : styles.badgeTopRight;

  return (
    <View style={containerStyle}>
      <Border borderColor={{ custom: borderColor }} borderRadius={size / 2} borderWidth={borderWidth} />
      <View style={styles.fill}>
        {iconUrl ? (
          <ImgixImage enableFasterImage size={imageSize} source={{ uri: iconUrl }} style={imageStyle} />
        ) : (
          <Text align="center" color={{ custom: accentColor }} size={fallbackTextSize} weight="heavy">
            {fallbackText.slice(0, 1)}
          </Text>
        )}
      </View>
      {leverage !== undefined ? (
        <LeverageBadge
          backgroundColor={accentColor}
          bleed={false}
          borderColor={badgeBorderColor}
          leverage={leverage}
          shadowColor={badgeShadowColor}
          shadowOpacity={badgeShadowOpacity}
          style={[styles.badgePosition, badgePositionStyle]}
          textColor={badgeTextColor}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  badgePosition: {
    position: 'absolute',
    zIndex: 100,
  },
  badgeTopLeft: {
    left: -BADGE_OFFSET,
    top: -BADGE_OFFSET,
  },
  badgeTopRight: {
    right: -BADGE_OFFSET,
    top: -BADGE_OFFSET,
  },
  fill: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
