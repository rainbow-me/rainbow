import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import GradientText from '@/components/text/GradientText';
import { Text, useColorMode } from '@/design-system';
import { getValueForColorMode, globalColors } from '@/design-system/color/palettes';
import type { TextSize, TextWeight } from '@/design-system/components/Text/Text';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { ShadowLayers } from '@/features/rnbw-membership/components/ShadowLayers';
import { getTierBadgeTheme } from '@/features/rnbw-membership/tierVisuals';
import type { Tier as TierType } from '@/features/rnbw-membership/types';
import { opacity } from '@/framework/ui/utils/opacity';

const BORDER_GRADIENT_START = { x: 0, y: 1 };
const BORDER_GRADIENT_END = { x: 0, y: 0 };
const BADGE_GRADIENT_START = { x: 0, y: 0 };
const BADGE_GRADIENT_END = { x: 0, y: 1 };
const BADGE_TEXT_GRADIENT_START = { x: 0, y: 0 };
const BADGE_TEXT_GRADIENT_END = { x: 0, y: 1 };

export const TierBadge = memo(function TierBadge({
  tier,
  height = 42,
  borderWidth = 2,
  fontSize = '22pt',
  weight = 'heavy',
}: {
  tier: TierType;
  height?: number;
  borderWidth?: number;
  fontSize?: TextSize;
  weight?: TextWeight;
}) {
  const { colorMode } = useColorMode();
  const borderRadius = height / 2;
  const { fill: badgeGradient, text, shadows: badgeShadows, border: badgeBorderGradient } = getTierBadgeTheme(tier.level);
  const {
    colors: badgeGradientColors,
    locations: badgeGradientLocations,
    start: badgeStart = BADGE_GRADIENT_START,
    end: badgeEnd = BADGE_GRADIENT_END,
  } = getValueForColorMode(badgeGradient, colorMode);
  const {
    colors: badgeTextGradientColors,
    locations: badgeTextGradientLocations,
    start: badgeTextStart = BADGE_TEXT_GRADIENT_START,
    end: badgeTextEnd = BADGE_TEXT_GRADIENT_END,
  } = getValueForColorMode(text.gradient, colorMode);
  const {
    colors: borderGradientColors,
    locations: borderGradientLocations,
    start: borderStart = BORDER_GRADIENT_START,
    end: borderEnd = BORDER_GRADIENT_END,
  } = getValueForColorMode(badgeBorderGradient, colorMode);
  const shadowStyles = getValueForColorMode(badgeShadows, colorMode);
  const textShadowStyle = getValueForColorMode(text.shadow, colorMode);
  const [firstBadgeGradientColor] = badgeGradientColors;
  const shadowLayerBackgroundColor = typeof firstBadgeGradientColor === 'string' ? firstBadgeGradientColor : '#FFFFFF';

  return (
    <ShadowLayers
      shadows={shadowStyles}
      borderRadius={borderRadius}
      backgroundColor={shadowLayerBackgroundColor}
      style={styles.shadowStack}
    >
      <GradientBorderView
        borderGradientColors={borderGradientColors}
        locations={borderGradientLocations}
        start={borderStart}
        end={borderEnd}
        borderWidth={borderWidth}
        style={[styles.tierBadge, { height, borderRadius }]}
      >
        <InnerShadow color={opacity(globalColors.white100, 0.1)} blur={1} dx={0} dy={3} borderRadius={borderRadius} />
        <LinearGradient
          colors={badgeGradientColors}
          locations={badgeGradientLocations}
          start={badgeStart}
          end={badgeEnd}
          style={StyleSheet.absoluteFill}
        />
        <GradientText
          colors={badgeTextGradientColors}
          locations={badgeTextGradientLocations}
          start={badgeTextStart}
          end={badgeTextEnd}
          shadow={textShadowStyle}
        >
          <Text size={fontSize} weight={weight} color="label">
            {tier.name.toLocaleUpperCase()}
          </Text>
        </GradientText>
      </GradientBorderView>
    </ShadowLayers>
  );
});

const styles = StyleSheet.create({
  shadowStack: {
    alignSelf: 'center',
  },
  tierBadge: {
    height: 42,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21,
    overflow: 'hidden',
  },
});
