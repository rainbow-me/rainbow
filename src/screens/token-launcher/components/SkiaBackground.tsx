import React, { useMemo } from 'react';

import { Canvas, Paint, Shadow, useImage, Image, Fill, Blur, rect, rrect, Box, Group } from '@shopify/react-native-skia';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Extrapolation, interpolate, useDerivedValue } from 'react-native-reanimated';

export function SkiaBackground({ width, height }: { width: number; height: number }) {
  const { accentColors } = useTokenLauncherContext();
  const shadowColor = accentColors.opacity20;

  const stepIndex = useTokenLauncherStore(state => state.stepIndex);
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const image = useImage(imageUri);

  const roundedRect = useMemo(() => {
    return rrect(rect(0, 0, width, height), 42, 42);
  }, [width, height]);

  const dimOverlayOpacity = useDerivedValue(() => {
    // 3 is success
    return interpolate(stepIndex.value, [2, 3], [1, 0], Extrapolation.CLAMP);
  });

  const innerShadowsOpacity = useDerivedValue(() => {
    return interpolate(stepIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP);
  });

  const innerShadowOneBlur = useDerivedValue(() => {
    return interpolate(stepIndex.value, [0, 1], [0, 20], Extrapolation.CLAMP);
  });

  const innerShadowTwoBlur = useDerivedValue(() => {
    return interpolate(stepIndex.value, [0, 1], [0, 2], Extrapolation.CLAMP);
  });

  if (!imageUri) return null;

  return (
    <Canvas style={{ width, height }}>
      <Image x={0} y={0} width={width} height={height} image={image} fit="cover">
        <Blur blur={100} />
      </Image>
      <Fill opacity={dimOverlayOpacity} color="rgba(26, 26, 26, 0.75)" />
      <Box box={roundedRect} color="transparent">
        <Paint color={'rgba(245, 248, 255, 0.06)'} style="stroke" strokeWidth={THICK_BORDER_WIDTH} />
      </Box>
      <Group opacity={innerShadowsOpacity}>
        <Box box={roundedRect}>
          <Shadow dx={0} dy={0} blur={innerShadowOneBlur} color={shadowColor} inner shadowOnly />
        </Box>
        <Box box={roundedRect}>
          <Shadow dx={0} dy={0} blur={innerShadowTwoBlur} color={shadowColor} inner shadowOnly />
        </Box>
      </Group>

      {/* More efficient, but opacity prop is broken on BoxShadow in react-native-skia <1.10.0 */}
      {/* <Group opacity={innerShadowsOpacity}>
        <Box box={roundedRect} color="transparent">
          <BoxShadow dx={0} dy={0} blur={innerShadowOneBlur} spread={2} color={shadowColor} inner />
        </Box>
        <Box box={roundedRect} color="transparent">
          <BoxShadow dx={0} dy={0} blur={innerShadowTwoBlur} spread={-2} color={shadowColor} inner />
        </Box>
      </Group> */}
    </Canvas>
  );
}
