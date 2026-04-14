import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { ShadowLayers } from '@/features/rnbw-membership/components/ShadowLayers';
import { MEMBERSHIP_CARD_BACKGROUND_COLOR } from '@/features/rnbw-membership/membershipCardTheme';
import { getTierPrimaryButtonTheme, getTierSecondaryButtonTheme } from '@/features/rnbw-membership/tierVisuals';
import type { Tier } from '@/features/rnbw-membership/types';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 0, y: 1 };
const INNER_SHADOW_COLOR = opacity('#FFFFFF', 0.1);

export type MembershipTierButtonVariant = 'primary' | 'secondary';

type MembershipTierButtonSurfaceProps = {
  tier: Tier;
  variant: MembershipTierButtonVariant;
  height: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const MembershipTierButtonSurface = memo(function MembershipTierButtonSurface({
  tier,
  variant,
  height,
  children,
  style,
}: MembershipTierButtonSurfaceProps) {
  const { isDarkMode, colorMode } = useColorMode();
  const borderRadius = height / 2;
  const shadowLayerBackgroundColor = getValueForColorMode(MEMBERSHIP_CARD_BACKGROUND_COLOR, colorMode);

  const { borderGradient, surfaceGradient, surfaceHighlight, shadows } = useMemo(() => {
    const surfaceTheme =
      variant === 'primary' ? getTierPrimaryButtonTheme(tier.level).surface : getTierSecondaryButtonTheme(tier.level).surface;

    return {
      borderGradient: getValueForColorMode(surfaceTheme.border, colorMode),
      surfaceGradient: getValueForColorMode(surfaceTheme.fill, colorMode),
      surfaceHighlight: surfaceTheme.highlight ? getValueForColorMode(surfaceTheme.highlight, colorMode) : null,
      shadows: getValueForColorMode(surfaceTheme.shadows, colorMode),
    };
  }, [tier.level, variant, colorMode]);

  const resolvedContainerStyle = useMemo(
    () => [styles.surface, { height, borderRadius }, style] satisfies StyleProp<ViewStyle>[],
    [height, borderRadius, style]
  );

  return (
    <ShadowLayers shadows={shadows} borderRadius={borderRadius} backgroundColor={shadowLayerBackgroundColor} style={styles.shadowStack}>
      <GradientBorderView
        borderWidth={isDarkMode ? THICK_BORDER_WIDTH : 1}
        borderGradientColors={borderGradient.colors}
        locations={borderGradient.locations}
        start={borderGradient.start ?? GRADIENT_START}
        end={borderGradient.end ?? GRADIENT_END}
        style={resolvedContainerStyle}
      >
        <LinearGradient
          colors={surfaceGradient.colors}
          locations={surfaceGradient.locations}
          start={surfaceGradient.start ?? GRADIENT_START}
          end={surfaceGradient.end ?? GRADIENT_END}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
        {surfaceHighlight && (
          <LinearGradient
            colors={surfaceHighlight.colors}
            locations={surfaceHighlight.locations}
            start={surfaceHighlight.start ?? GRADIENT_START}
            end={surfaceHighlight.end ?? GRADIENT_END}
            style={StyleSheet.absoluteFill}
          />
        )}
        <InnerShadow color={INNER_SHADOW_COLOR} blur={1} dx={0} dy={3} borderRadius={borderRadius} />
        {children}
      </GradientBorderView>
    </ShadowLayers>
  );
});

const styles = StyleSheet.create({
  shadowStack: {
    overflow: 'visible',
  },
  surface: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
});
