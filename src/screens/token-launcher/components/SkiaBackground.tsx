import React from 'react';

import {
  Canvas,
  RoundedRect,
  Paint,
  vec,
  Blur,
  Group,
  Shadow,
  useImage,
  Image,
  Fill,
  ColorMatrix,
  interpolate,
  BackdropBlur,
} from '@shopify/react-native-skia';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { useTheme } from '@/theme';
import { Extrapolation } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

export function SkiaBackground({ width, height }: { width: number; height: number }) {
  const { colors } = useTheme();
  const stepIndex = useTokenLauncherStore(state => state.stepIndex);
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const imagePrimaryColor = useTokenLauncherStore(state => state.imagePrimaryColor);
  const image = useImage(imageUri);
  const shadowColor = colors.alpha(imagePrimaryColor, 0.2);

  const shadowOpacity = interpolate(stepIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP);

  return (
    <Canvas style={{ width, height }}>
      <RoundedRect opacity={stepIndex} x={0} y={0} width={width} height={height} r={42}>
        {/* This needs to be adjusted to match react native border width behavior */}
        <Paint color={'rgba(245, 248, 255, 0.06)'} style="stroke" strokeWidth={THICK_BORDER_WIDTH} />
        <Shadow dx={0} dy={0} blur={40} color={shadowColor} inner />
        <Shadow dx={0} dy={0} blur={4} color={shadowColor} inner />
      </RoundedRect>
      <Image x={0} y={0} width={width} height={height} image={image} fit="cover">
        {/* <Blur blur={200} /> */}
      </Image>
      <BackdropBlur blur={200}>
        <Fill color="rgba(26, 26, 26, 0.75)" />
      </BackdropBlur>
    </Canvas>
  );
}
