import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Blur,
  Canvas,
  Group,
  Mask,
  Paint,
  RoundedRect,
  Shadow,
  LinearGradient as SkiaLinearGradient,
  vec,
} from '@shopify/react-native-skia';

import type { GradientColors, GradientLocations, HardLightOverlay } from '@/features/rnbw-membership/tierVisuals';

const DEFAULT_FILL_START = { x: 0, y: 0 };
const DEFAULT_FILL_END = { x: 0, y: 1 };
const MASK_SHADOW_COLOR = '#FFFFFF';

type RainbowShimmerFillProps = {
  fillColors: GradientColors;
  fillLocations?: GradientLocations;
  fillStart?: { x: number; y: number };
  fillEnd?: { x: number; y: number };
  borderRadius: number;
  overlay: HardLightOverlay;
};

export const RainbowShimmerFill = memo(function RainbowShimmerFill({
  fillColors,
  fillLocations,
  fillStart = DEFAULT_FILL_START,
  fillEnd = DEFAULT_FILL_END,
  borderRadius,
  overlay,
}: RainbowShimmerFillProps) {
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);

  const onLayout = useCallback((e: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setMeasured(prev => (prev && prev.width === w && prev.height === h ? prev : { width: w, height: h }));
  }, []);

  const width = measured?.width ?? 0;
  const height = measured?.height ?? 0;
  const canDisplay = width > 0 && height > 0;

  // Skia wants mutable arrays
  const skiaFillColors = useMemo(() => [...fillColors], [fillColors]);
  const skiaFillLocations = useMemo(() => (fillLocations ? [...fillLocations] : undefined), [fillLocations]);
  const skiaOverlayColors = useMemo(() => [...overlay.colors], [overlay.colors]);
  const skiaOverlayLocations = useMemo(() => [...overlay.locations], [overlay.locations]);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {canDisplay && (
        <Canvas style={StyleSheet.absoluteFill}>
          <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
            <SkiaLinearGradient
              start={vec(width * fillStart.x, height * fillStart.y)}
              end={vec(width * fillEnd.x, height * fillEnd.y)}
              colors={skiaFillColors}
              positions={skiaFillLocations}
            />
          </RoundedRect>

          <Group layer={<Paint blendMode="hardLight" />}>
            <Mask
              mask={
                <Group>
                  <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
                    <Shadow
                      dx={overlay.maskShadow.dx}
                      dy={overlay.maskShadow.dy}
                      blur={overlay.maskShadow.blur}
                      color={MASK_SHADOW_COLOR}
                      inner
                      shadowOnly
                    />
                    <Blur blur={1.5} />
                  </RoundedRect>
                </Group>
              }
            >
              <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
                <SkiaLinearGradient
                  start={vec(0, height / 2)}
                  end={vec(width, height / 2)}
                  colors={skiaOverlayColors}
                  positions={skiaOverlayLocations}
                />
              </RoundedRect>
            </Mask>
          </Group>
        </Canvas>
      )}
    </View>
  );
});
