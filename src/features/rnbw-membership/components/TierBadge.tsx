import { memo } from 'react';
import { Text, useColorMode } from '@/design-system';
import { TIER_VISUALS } from '@/features/rnbw-membership/constants';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { LinearGradient } from 'expo-linear-gradient';
import { opacity } from '@/framework/ui/utils/opacity';
import { getValueForColorMode, globalColors } from '@/design-system/color/palettes';
import { StyleSheet, View } from 'react-native';
import type { Tier as TierType } from '@/features/rnbw-membership/types';
import GradientText from '@/components/text/GradientText';
import type { TextSize, TextWeight } from '@/design-system/components/Text/Text';

const BORDER_GRADIENT_START = { x: 0, y: 1 };
const BORDER_GRADIENT_END = { x: 0, y: 0 };
const BADGE_GRADIENT_START = { x: 0, y: 0 };
const BADGE_GRADIENT_END = { x: 0, y: 1 };
const BADGE_TEXT_GRADIENT_START = { x: 0, y: 0 };
const BADGE_TEXT_GRADIENT_END = { x: 0, y: 1 };

export const TierBadge = memo(function TierBadge({
  tier,
  height = 42,
  fontSize = '22pt',
  weight = 'heavy',
}: {
  tier: TierType;
  height?: number;
  fontSize?: TextSize;
  weight?: TextWeight;
}) {
  const { colorMode } = useColorMode();
  const { badgeGradient, badgeTextGradient, badgeTextShadow, badgeShadow, badgeBorderGradient } = TIER_VISUALS[tier.level];
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
  } = getValueForColorMode(badgeTextGradient, colorMode);
  const {
    colors: borderGradientColors,
    locations: borderGradientLocations,
    start: borderStart = BORDER_GRADIENT_START,
    end: borderEnd = BORDER_GRADIENT_END,
  } = getValueForColorMode(badgeBorderGradient, colorMode);
  const shadowStyle = getValueForColorMode(badgeShadow, colorMode);
  const textShadowStyle = getValueForColorMode(badgeTextShadow, colorMode);

  return (
    <View style={[styles.shadowWrapper, shadowStyle]}>
      <GradientBorderView
        borderGradientColors={borderGradientColors}
        locations={borderGradientLocations}
        start={borderStart}
        end={borderEnd}
        borderWidth={2}
        style={[styles.tierBadge, { height, borderRadius: height / 2 }]}
      >
        <InnerShadow color={opacity(globalColors.white100, 0.1)} blur={1} dx={0} dy={3} />
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
    </View>
  );
});

const styles = StyleSheet.create({
  shadowWrapper: {
    alignSelf: 'center',
    borderRadius: 21,
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
