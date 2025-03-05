import React, { useMemo, memo } from 'react';

import { Canvas, Shadow, Image, Fill, rect, rrect, Box, Group, BackdropBlur } from '@shopify/react-native-skia';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Extrapolation, interpolate, useDerivedValue } from 'react-native-reanimated';
import { useForegroundColor } from '@/design-system';

export const SkiaBackground = memo(function SkiaBackground({ width, height }: { width: number; height: number }) {
  const separatorSecondaryColor = useForegroundColor('separatorSecondary');
  const { accentColors, tokenBackgroundImage } = useTokenLauncherContext();
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const stepIndex = useTokenLauncherStore(state => state.stepIndex);
  const shadowColor = accentColors.opacity20;

  const roundedRect = useMemo(() => {
    return rrect(rect(0, 0, width, height), 42, 42);
  }, [width, height]);

  const dimOverlayOpacity = useDerivedValue(() => {
    // 3 is success
    return interpolate(stepIndex.value, [2, 3], [1, 0], Extrapolation.CLAMP);
  });

  const reviewAndCreatingStepEffectsOpacity = useDerivedValue(() => {
    return interpolate(stepIndex.value, [0, 1, 2, 3], [0, 1, 1, 0], Extrapolation.CLAMP);
  });

  const innerShadowOneBlur = useDerivedValue(() => {
    return interpolate(stepIndex.value, [0, 1], [0, 20], Extrapolation.CLAMP);
  });

  const innerShadowTwoBlur = useDerivedValue(() => {
    return interpolate(stepIndex.value, [0, 1], [0, 2], Extrapolation.CLAMP);
  });

  const successStepEffectsOpacity = useDerivedValue(() => {
    return interpolate(stepIndex.value, [2, 3], [0, 1], Extrapolation.CLAMP);
  });

  if (!tokenBackgroundImage || !imageUri) return null;

  return (
    <Canvas style={{ width, height }}>
      <Image x={0} y={0} width={width} height={height} image={tokenBackgroundImage} fit="cover" />
      <BackdropBlur antiAlias dither blur={100} clip={{ x: 0, y: 0, width: width, height: height }}>
        <Fill opacity={dimOverlayOpacity} antiAlias dither color="rgba(26, 26, 26, 0.75)" />
      </BackdropBlur>

      <Box box={roundedRect} strokeWidth={THICK_BORDER_WIDTH * 2} style="stroke" color={separatorSecondaryColor} />

      <Group opacity={reviewAndCreatingStepEffectsOpacity}>
        <Box box={roundedRect}>
          <Shadow dx={0} dy={0} blur={innerShadowOneBlur} color={shadowColor} inner shadowOnly />
        </Box>
        <Box box={roundedRect}>
          <Shadow dx={0} dy={0} blur={innerShadowTwoBlur} color={shadowColor} inner shadowOnly />
        </Box>
      </Group>

      <Group opacity={successStepEffectsOpacity}>
        <Box box={roundedRect} strokeWidth={8} style="stroke" color={'rgba(255, 255, 255, 0.1)'} />
        <Box box={roundedRect} blendMode={'plus'}>
          <Shadow dx={0} dy={0} blur={8} color={'rgba(255, 255, 255, 0.4)'} inner shadowOnly />
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
});
