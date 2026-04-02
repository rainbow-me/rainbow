import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, useBackgroundColor, useColorMode } from '@/design-system';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { opacity } from '@/framework/ui/utils/opacity';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';

const GRADIENT_FILL_COLORS = ['#27D857', '#1DB847'] as const;
const GRADIENT_FILL_START = { x: 0, y: 0.5 };
const GRADIENT_FILL_END = { x: 1, y: 0.5 };
const GRADIENT_BORDER_START = { x: 0.5, y: 0 };
const GRADIENT_BORDER_END = { x: 0.5, y: 0.5 };
const MIN_PROGRESS = 0.05;
const NOTCH_INNER_SHADOW_COLOR = opacity('#7A7A7A', 0.13);

type ProgressMeterProps = {
  progress: number;
  height: number;
  width: number;
  notchWidth: number;
  notchHeight: number;
  notchCount?: number;
};

export const ProgressMeter = memo(function ProgressMeter({
  progress,
  height,
  width,
  notchWidth,
  notchHeight,
  notchCount = 4,
}: ProgressMeterProps) {
  const { isDarkMode } = useColorMode();
  const surfaceSecondary = useBackgroundColor('surfaceSecondary');
  const backgroundColor = isDarkMode ? '#242529' : surfaceSecondary;
  const clampedProgress = Math.max(MIN_PROGRESS, Math.min(1, progress));
  const fillHeight = height * clampedProgress;
  const borderRadius = height / 2;

  const sx = useMemo(
    () => ({
      container: {
        height,
        width,
        borderRadius,
        overflow: 'hidden' as const,
      },
      fill: {
        height: fillHeight,
        width,
        shadowColor: opacity('#39D6B2', 0.3),
        shadowRadius: 2.5,
      },
      fillBorderTop: {
        backgroundColor: isDarkMode ? opacity('#FFFFFF', 0.2) : opacity('#000000', 0.06),
      },
    }),
    [fillHeight, height, width, borderRadius, isDarkMode]
  );

  return (
    <GradientBorderView
      borderGradientColors={
        isDarkMode
          ? [opacity('#9AA2A7', 0.016), opacity('#9AA2A7', 0.08)]
          : // no border in light mode
            ['rgba(0,0,0,0)', 'rgba(0,0,0,0)']
      }
      start={GRADIENT_BORDER_START}
      end={GRADIENT_BORDER_END}
      backgroundColor={backgroundColor}
      style={sx.container}
    >
      <InnerShadow
        width={width}
        height={height}
        borderRadius={borderRadius}
        color={isDarkMode ? opacity('#000000', 0.43) : opacity('#7A7A7A', 0.13)}
        blur={2}
        dx={0}
        dy={1}
      />
      <Box style={[styles.fill, sx.fill]}>
        <LinearGradient colors={GRADIENT_FILL_COLORS} start={GRADIENT_FILL_START} end={GRADIENT_FILL_END} style={StyleSheet.absoluteFill} />
        <View style={[styles.fillBorderTop, sx.fillBorderTop]} />
      </Box>
      <Notches count={notchCount} progress={progress} notchWidth={notchWidth} notchHeight={notchHeight} />
    </GradientBorderView>
  );
});

const Notches = memo(function Notches({
  count,
  progress,
  notchWidth,
  notchHeight,
}: {
  count: number;
  progress: number;
  notchWidth: number;
  notchHeight: number;
}) {
  const { isDarkMode } = useColorMode();

  const sx = useMemo(
    () => ({
      notch: {
        width: notchWidth,
        height: notchHeight,
        borderRadius: notchHeight / 2,
        backgroundColor: isDarkMode ? '#2F3034' : '#E3E3E3',
      },
      notchOnFill: {
        backgroundColor: isDarkMode ? opacity('#090909', 0.3) : opacity('#FFFFFF', 0.3),
      },
    }),
    [notchHeight, notchWidth, isDarkMode]
  );

  return (
    <View style={styles.notches}>
      {Array.from({ length: count }).map((_, index) => {
        const isOnFill = progress >= (count - index) / (count + 1);
        return (
          <View key={index} style={[sx.notch, isOnFill && sx.notchOnFill]}>
            {!isOnFill && (
              <InnerShadow
                width={notchWidth}
                height={notchHeight}
                borderRadius={notchHeight / 2}
                color={NOTCH_INNER_SHADOW_COLOR}
                blur={2}
                dx={0}
                dy={1}
              />
            )}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    bottom: 0,
    borderBottomWidth: 0,
  },
  fillBorderTop: {
    position: 'absolute',
    top: 0,
    height: 1,
    width: '100%',
  },
  notches: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flex: 1,
  },
});
