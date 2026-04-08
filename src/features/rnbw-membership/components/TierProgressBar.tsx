import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { useBackgroundColor, useColorMode } from '@/design-system';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacity } from '@/framework/ui/utils/opacity';
import { TIER_VISUALS } from '@/features/rnbw-membership/constants';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { LinearGradient } from 'expo-linear-gradient';
import { Blur, Canvas, LinearGradient as SkiaLinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import type { Tier } from '@/features/rnbw-membership/types';

const PROGRESS_BAR_HORIZONTAL_PADDING = 12;
const PROGRESS_HIGHLIGHT_INSET = 5;
const PROGRESS_HIGHLIGHT_HEIGHT = 5;
const PROGRESS_HIGHLIGHT_RADIUS = 2.5;
const PROGRESS_HIGHLIGHT_BLUR = 2;
const PROGRESS_HIGHLIGHT_BLUR_PADDING = PROGRESS_HIGHLIGHT_BLUR * 2;

type TierProgressBarProps = {
  width: number;
  height: number;
  tier: Tier;
  tierIndex: number;
  tierProgress: number;
  tierCount: number;
};

export const TierProgressBar = memo(function TierProgressBar({
  width,
  height,
  tier,
  tierIndex,
  tierProgress,
  tierCount,
}: TierProgressBarProps) {
  const { isDarkMode, colorMode } = useColorMode();
  const surfaceSecondary = useBackgroundColor('surfaceSecondary');
  const backgroundColor = isDarkMode ? '#242529' : surfaceSecondary;
  const isMaxTier = tierIndex === tierCount - 1;

  const { gradient, borderGradient, shadow, highlightGradient } = useMemo(() => {
    const visuals = TIER_VISUALS[tier.level];
    return {
      gradient: getValueForColorMode(visuals.progressBarGradient, colorMode),
      borderGradient: getValueForColorMode(visuals.progressBarBorderGradient, colorMode),
      shadow: getValueForColorMode(visuals.progressBarShadow, colorMode),
      highlightGradient: getValueForColorMode(visuals.progressHighlightGradient, colorMode),
    };
  }, [tier.level, colorMode]);

  const tierMarkerPositions = useMemo(() => {
    const usableWidth = width - PROGRESS_BAR_HORIZONTAL_PADDING * 2;
    return Array.from({ length: tierCount }, (_, i) => PROGRESS_BAR_HORIZONTAL_PADDING * 2 + (i * usableWidth) / (tierCount - 1));
  }, [tierCount, width]);

  const fillWidth = useMemo(() => {
    const base = tierMarkerPositions[tierIndex];
    const next = tierMarkerPositions[tierIndex + 1] ?? base;
    return base + tierProgress * (next - base);
  }, [tierMarkerPositions, tierIndex, tierProgress]);

  const { leftRadius, rightRadius } = useMemo(() => {
    const full = height / 2;
    return { leftRadius: full, rightRadius: isMaxTier ? full : 8 };
  }, [height, isMaxTier]);

  const progressHighlight = useMemo(() => {
    const rectWidth = fillWidth - PROGRESS_HIGHLIGHT_INSET * 2;

    // Blur needs extra canvas area, otherwise Skia clips the softened edges.
    return {
      canvasLeft: PROGRESS_HIGHLIGHT_INSET - PROGRESS_HIGHLIGHT_BLUR_PADDING,
      canvasTop: PROGRESS_HIGHLIGHT_INSET - PROGRESS_HIGHLIGHT_BLUR_PADDING,
      canvasWidth: rectWidth + PROGRESS_HIGHLIGHT_BLUR_PADDING * 2,
      canvasHeight: PROGRESS_HIGHLIGHT_HEIGHT + PROGRESS_HIGHLIGHT_BLUR_PADDING * 2,
      rectX: PROGRESS_HIGHLIGHT_BLUR_PADDING,
      rectY: PROGRESS_HIGHLIGHT_BLUR_PADDING,
      rectWidth,
    };
  }, [fillWidth]);

  return (
    <GradientBorderView
      borderGradientColors={isDarkMode ? [opacity('#9AA2A7', 0.016), opacity('#9AA2A7', 0.08)] : ['rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
      borderWidth={1}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      backgroundColor={backgroundColor}
      style={{ height, width, overflow: 'visible' }}
    >
      <TierDots tierCount={tierCount} />
      <GradientBorderView
        borderGradientColors={borderGradient.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        borderWidth={1}
        borderTopRightRadius={rightRadius}
        borderBottomRightRadius={rightRadius}
        borderTopLeftRadius={leftRadius}
        borderBottomLeftRadius={leftRadius}
        style={{
          height,
          width: fillWidth,
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'visible',
          ...shadow,
        }}
      >
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={[
            StyleSheet.absoluteFill,
            {
              borderTopRightRadius: rightRadius,
              borderBottomRightRadius: rightRadius,
              borderTopLeftRadius: leftRadius,
              borderBottomLeftRadius: leftRadius,
              borderCurve: 'continuous',
            },
          ]}
        />
        <Canvas
          style={{
            position: 'absolute',
            top: progressHighlight.canvasTop,
            left: progressHighlight.canvasLeft,
            height: progressHighlight.canvasHeight,
            width: progressHighlight.canvasWidth,
          }}
        >
          <RoundedRect
            x={progressHighlight.rectX}
            y={progressHighlight.rectY}
            width={progressHighlight.rectWidth}
            height={PROGRESS_HIGHLIGHT_HEIGHT}
            r={PROGRESS_HIGHLIGHT_RADIUS}
            opacity={0.5}
          >
            <SkiaLinearGradient
              start={vec(progressHighlight.rectX, progressHighlight.rectY)}
              end={vec(progressHighlight.rectX + progressHighlight.rectWidth, progressHighlight.rectY)}
              // Cast expo LinearGradientProps for Skia compatibility
              positions={highlightGradient.locations as unknown as number[] | undefined}
              colors={highlightGradient.colors as unknown as string[]}
            />
            <Blur blur={PROGRESS_HIGHLIGHT_BLUR} />
          </RoundedRect>
        </Canvas>
      </GradientBorderView>
      <InnerShadow
        width={width}
        height={height}
        borderRadius={height / 2}
        color={isDarkMode ? opacity('#000000', 0.43) : opacity('#7A7A7A', 0.13)}
        blur={2}
        dx={0}
        dy={1}
      />
    </GradientBorderView>
  );
});

const DOT_SIZE = 8;
const DOT_RADIUS = DOT_SIZE / 2;

const TierDots = memo(function TierDots({ tierCount }: { tierCount: number }) {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: tierCount }).map((_, index) => (
        <TierDot key={index} />
      ))}
    </View>
  );
});

function TierDot() {
  const { isDarkMode } = useColorMode();
  return (
    <View style={[styles.dot, { backgroundColor: isDarkMode ? opacity('#FFFFFF', 0.05) : '#E3E3E3' }]}>
      {!isDarkMode && (
        <InnerShadow width={DOT_SIZE} height={DOT_SIZE} borderRadius={DOT_RADIUS} color={opacity('#7A7A7A', 0.13)} blur={2} dx={0} dy={1} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    paddingHorizontal: PROGRESS_BAR_HORIZONTAL_PADDING,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_RADIUS,
    overflow: 'hidden',
  },
});
