import { memo, useCallback, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { Canvas, Group, LinearGradient, Path, Shadow } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { Border } from '@/design-system/components/Border/Border';
import { getSquirclePath } from '@/design-system/layout/shapes';

type SurfaceShadow = {
  color: string;
  blur: number;
  dx: number;
  dy: number;
};

/** Keeps the continuous surface and its shadows separate from content clipping and the inside border. */
export const SportsSurface = memo(function SportsSurface({
  borderRadius,
  color = 'transparent',
  gradient,
  borderColor,
  borderWidth = 2,
  shadows = [],
  innerShadow,
  backdrop,
  clipContent = false,
  children,
  style,
  testID,
}: {
  borderRadius: number;
  color?: string;
  gradient?: readonly [string, string];
  borderColor?: string;
  borderWidth?: number;
  shadows?: readonly (SurfaceShadow & { drawBehind?: boolean })[];
  innerShadow?: SurfaceShadow & { blendMode?: 'plus' };
  backdrop?: ReactNode;
  clipContent?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const path = useSharedValue('M0 0Z');
  const height = useSharedValue(0);
  const gradientEnd = useDerivedValue(() => ({ x: 0, y: height.value }));
  const bleed = Math.ceil(Math.max(0, ...shadows.map(shadow => shadow.blur * 3 + Math.max(Math.abs(shadow.dx), Math.abs(shadow.dy)))));
  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      height.value = layout.height;
      path.value = getSquirclePath({ width: layout.width, height: layout.height, borderRadius });
    },
    [borderRadius, height, path]
  );
  const corners = { borderRadius, borderCurve: 'continuous' as const };

  return (
    <View onLayout={onLayout} testID={testID}>
      {backdrop && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, corners, styles.clip]}>
          {backdrop}
        </View>
      )}
      <Canvas pointerEvents="none" style={{ position: 'absolute', top: -bleed, right: -bleed, bottom: -bleed, left: -bleed }}>
        <Group transform={[{ translateX: bleed }, { translateY: bleed }]}>
          {shadows.map((shadow, index) => {
            const drawing = (
              <Path key={index} path={path}>
                <Shadow color={shadow.color} blur={shadow.blur} dx={shadow.dx} dy={shadow.dy} shadowOnly />
              </Path>
            );
            // Skia 2.4 restores an unsaved transform for invertClip={false}.
            return shadow.drawBehind ? (
              drawing
            ) : (
              <Group key={index} clip={path} invertClip>
                {drawing}
              </Group>
            );
          })}
          <Path path={path} color={gradient ? '#FFFFFF' : color}>
            {gradient && <LinearGradient start={{ x: 0, y: 0 }} end={gradientEnd} colors={[...gradient]} />}
          </Path>
          {innerShadow && (
            <Path path={path} blendMode={innerShadow.blendMode}>
              <Shadow color={innerShadow.color} blur={innerShadow.blur} dx={innerShadow.dx} dy={innerShadow.dy} inner shadowOnly />
            </Path>
          )}
        </Group>
      </Canvas>
      <View style={[style, corners, clipContent && styles.clip]}>{children}</View>
      {borderColor && (
        <Border borderRadius={borderRadius} borderWidth={borderWidth} borderColor={{ custom: borderColor }} enableInLightMode />
      )}
    </View>
  );
});

const styles = StyleSheet.create({ clip: { overflow: 'hidden' } });
