import { Canvas, DrawingNodeProps, Fill, Group, LinearGradient, Path, Rect, Shadow, SkiaProps, vec } from '@shopify/react-native-skia';
import { getSvgPath } from 'figma-squircle';
import React, { ReactElement, ReactNode, memo, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { convertToRGBA } from 'react-native-reanimated';
import { useDeepCompareMemo } from 'use-deep-compare';
import { ButtonPressAnimation } from '@/components/animations';
import { useBackgroundColor, useColorMode } from '@/design-system';
import { BackgroundColor, globalColors } from '@/design-system/color/palettes';
import { IS_IOS } from '@/env';
import { opacity } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

type ValueByTheme<T extends string | number | boolean | null | undefined> = { dark: T; light: T } | T;

export type SkiaCardProps = {
  borderRadius?: number;
  color?: BackgroundColor | string;
  foregroundComponent?: ReactNode;
  height?: number;
  innerShadowOpacity?: ValueByTheme<number>;
  onLongPress?: () => void;
  onPress?: () => void;
  scaleTo?: number;
  shadowColor?: ValueByTheme<string>;
  skiaBackground?: ReactElement<SkiaProps<DrawingNodeProps>>;
  skiaForeground?: ReactNode;
  strokeOpacity?: { start: number; end: number };
  width?: number;
} & ({ color: BackgroundColor | string; skiaBackground?: never } | { color?: never; skiaBackground: ReactNode });

const CARDS_PER_ROW = 2;
const GAP = 12;
const HORIZONTAL_INSET = 20;

export const DEFAULT_CARD_SIZE = (DEVICE_WIDTH - HORIZONTAL_INSET * 2 - GAP * (CARDS_PER_ROW - 1)) / CARDS_PER_ROW;

const STROKE_WIDTH = 4;
const STROKE_TRANSFORM = [{ translateX: STROKE_WIDTH }, { translateY: STROKE_WIDTH }];

export const SkiaCard = memo(function SkiaCard({
  borderRadius = 32,
  color = '',
  foregroundComponent,
  height = DEFAULT_CARD_SIZE,
  innerShadowOpacity = { dark: 1, light: 0.4 },
  onLongPress,
  onPress,
  scaleTo = 0.86,
  shadowColor = { dark: 'transparent', light: color || 'transparent' },
  skiaBackground,
  skiaForeground,
  strokeOpacity = { start: 0.12, end: 0.048 },
  width = DEFAULT_CARD_SIZE,
}: SkiaCardProps) {
  const { isDarkMode } = useColorMode();
  const backgroundColor = useBackgroundColor(color);

  const { backgroundRect, squirclePath, strokePath } = useMemo(
    () => ({
      backgroundRect: { height, width, x: 0, y: 0 },
      squirclePath: getSquirclePath({ borderRadius, height, width }),
      strokePath: getSquirclePath({
        borderRadius: borderRadius - STROKE_WIDTH,
        height: height - STROKE_WIDTH * 2,
        width: width - STROKE_WIDTH * 2,
      }),
    }),
    [borderRadius, height, width]
  );

  const { strokeGradientConfig, styles } = useDeepCompareMemo(
    () => ({
      strokeGradientConfig: getStrokeGradientConfig(strokeOpacity),
      styles: getStyles({ borderRadius, height, innerShadowOpacity, isDarkMode, shadowColor, width }),
    }),
    [borderRadius, height, innerShadowOpacity, isDarkMode, shadowColor, strokeOpacity, width]
  );

  return (
    <ButtonPressAnimation onLongPress={onLongPress} onPress={onPress} scaleTo={scaleTo} style={styles.container}>
      <View style={styles.shadowLayer} />
      <View style={styles.innerContainer}>
        <Canvas style={styles.canvas}>
          <Group clip={backgroundRect}>
            {skiaBackground ?? <Fill color={backgroundColor} />}
            <CardHighlights
              height={height}
              innerShadowColor={styles.innerShadowColor}
              isDarkMode={isDarkMode}
              squirclePath={squirclePath}
              strokeGradientConfig={strokeGradientConfig}
              strokePath={strokePath}
              width={width}
            />
            {skiaForeground}
          </Group>
        </Canvas>
      </View>
      {foregroundComponent ? <View style={staticStyles.foregroundContainer}>{foregroundComponent}</View> : null}
    </ButtonPressAnimation>
  );
});

const CardHighlights = memo(function CardHighlights({
  height,
  innerShadowColor,
  isDarkMode,
  squirclePath,
  strokeGradientConfig,
  strokePath,
  width,
}: {
  height: number;
  innerShadowColor: string;
  isDarkMode: boolean;
  squirclePath: string;
  strokeGradientConfig: { colors: { dark: string[]; light: string[] }; end: { x: number; y: number }; start: { x: number; y: number } };
  strokePath: string;
  width: number;
}) {
  return (
    <>
      <Path path={squirclePath}>
        <Shadow blur={5 / 2} color={isDarkMode ? innerShadowColor : 'transparent'} dx={0} dy={1} inner shadowOnly />
      </Path>

      <Rect
        blendMode={isDarkMode ? 'plus' : 'overlay'}
        color={globalColors.white100}
        clip={strokePath}
        height={height}
        invertClip={true}
        transform={STROKE_TRANSFORM}
        width={width}
        x={-STROKE_WIDTH}
        y={-STROKE_WIDTH}
      >
        <LinearGradient
          colors={strokeGradientConfig.colors[isDarkMode ? 'dark' : 'light']}
          end={strokeGradientConfig.end}
          start={strokeGradientConfig.start}
        />
      </Rect>
    </>
  );
});

export function getSquirclePath({
  borderRadius,
  cornerSmoothing = IS_IOS ? 0.6 : 0,
  height,
  width,
}: {
  borderRadius: number;
  cornerSmoothing?: number;
  height: number;
  width: number;
}): string {
  return getSvgPath({
    cornerRadius: borderRadius,
    cornerSmoothing,
    height,
    width,
  });
}

function getStrokeGradientConfig(strokeOpacity: { start: number; end: number }) {
  return {
    colors: {
      dark: [opacity(globalColors.white100, strokeOpacity.start), opacity(globalColors.white100, strokeOpacity.end)],
      light: [opacity(globalColors.white100, 0), opacity(globalColors.white100, 0)],
    },
    end: vec(DEFAULT_CARD_SIZE / 2, DEFAULT_CARD_SIZE),
    start: vec(DEFAULT_CARD_SIZE / 2, 0),
  };
}

function getStyles({
  borderRadius,
  height,
  innerShadowOpacity,
  isDarkMode,
  shadowColor,
  width,
}: Required<Pick<SkiaCardProps, 'borderRadius' | 'height' | 'innerShadowOpacity' | 'shadowColor' | 'width'>> & {
  isDarkMode: boolean;
}) {
  const [r, g, b, shadowOpacity] = convertToRGBA(getThemeValue(shadowColor, isDarkMode));
  const solidShadowColor = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;

  return {
    canvas: {
      borderRadius,
      height,
      width,
    },
    container: {
      alignItems: 'center',
      height,
      justifyContent: 'center',
      position: 'relative',
      width,
    },
    innerContainer: {
      borderRadius,
      height,
      overflow: 'hidden',
      position: 'absolute',
      width,
    } satisfies ViewStyle,

    innerShadowColor: opacity(globalColors[isDarkMode ? 'white100' : 'grey100'], getThemeValue(innerShadowOpacity, isDarkMode)),

    shadowLayer: IS_IOS
      ? ({
          backgroundColor: solidShadowColor,
          borderRadius,
          height,
          opacity: shadowOpacity,
          pointerEvents: 'none',
          position: 'absolute',
          shadowColor: solidShadowColor,
          shadowOffset: { height: 6, width: 0 },
          shadowOpacity,
          shadowRadius: 9,
          width,
        } satisfies ViewStyle)
      : undefined,
  };
}

function getThemeValue<T extends string | number | boolean | null | undefined>(value: T | ValueByTheme<T>, isDarkMode: boolean): T {
  return typeof value === 'object' && value !== null ? value[isDarkMode ? 'dark' : 'light'] : value;
}

const staticStyles = StyleSheet.create({
  foregroundContainer: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
});
