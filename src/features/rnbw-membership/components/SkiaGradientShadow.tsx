import { memo, useCallback, useMemo, useState } from 'react';
import { PixelRatio, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { Blur, Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec } from '@shopify/react-native-skia';

import type { GradientShadow } from '@/features/rnbw-membership/tierVisuals';

const DEFAULT_START = { x: 0, y: 0.5 };
const DEFAULT_END = { x: 1, y: 0.5 };

type SkiaGradientShadowProps = {
  borderRadius: number;
  shadow: GradientShadow;
};

export const SkiaGradientShadow = memo(function SkiaGradientShadow({ borderRadius, shadow }: SkiaGradientShadowProps) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);

  const dx = shadow.dx ?? 0;
  const dy = shadow.dy ?? 0;
  const start = shadow.start ?? DEFAULT_START;
  const end = shadow.end ?? DEFAULT_END;
  const padding = useMemo(
    () => PixelRatio.roundToNearestPixel(shadow.blur * 2 + Math.max(Math.abs(dx), Math.abs(dy))),
    [shadow.blur, dx, dy]
  );

  const skiaColors = useMemo(() => [...shadow.colors], [shadow.colors]);
  const skiaLocations = useMemo(() => (shadow.locations ? [...shadow.locations] : undefined), [shadow.locations]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextLayout = {
      width: PixelRatio.roundToNearestPixel(event.nativeEvent.layout.width),
      height: PixelRatio.roundToNearestPixel(event.nativeEvent.layout.height),
    };

    setLayout(current => (current && current.width === nextLayout.width && current.height === nextLayout.height ? current : nextLayout));
  }, []);

  const width = layout?.width ?? 0;
  const height = layout?.height ?? 0;
  const canRender = width > 0 && height > 0;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={handleLayout}>
      {canRender && (
        <Canvas
          style={[
            styles.canvas,
            {
              top: -padding,
              left: -padding,
              width: width + padding * 2,
              height: height + padding * 2,
            },
          ]}
        >
          <RoundedRect x={padding + dx} y={padding + dy} width={width} height={height} r={borderRadius} opacity={shadow.opacity}>
            <SkiaLinearGradient
              start={vec(padding + dx + width * start.x, padding + dy + height * start.y)}
              end={vec(padding + dx + width * end.x, padding + dy + height * end.y)}
              colors={skiaColors}
              positions={skiaLocations}
            />
            <Blur blur={shadow.blur} />
          </RoundedRect>
        </Canvas>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
  },
});
