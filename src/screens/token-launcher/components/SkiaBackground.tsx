import React from 'react';

import {
  Canvas,
  RoundedRect,
  Paint,
  Shadow,
  useImage,
  Image,
  Fill,
  BackdropBlur,
  // BoxShadow,
  // Box,
  // rrect,
  // rect,
} from '@shopify/react-native-skia';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { interpolate, useDerivedValue } from 'react-native-reanimated';

export function SkiaBackground({ width, height }: { width: number; height: number }) {
  const { accentColors } = useTokenLauncherContext();

  const stepIndex = useTokenLauncherStore(state => state.stepIndex);
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const image = useImage(imageUri);

  const dimOverlayOpacity = useDerivedValue(() => {
    // 3 is success
    return interpolate(stepIndex.value, [0, 1, 2, 3], [1, 1, 1, 0]);
  });

  const shadowColor = accentColors.opacity20;

  if (!imageUri) return null;

  return (
    <Canvas style={{ width, height }}>
      <Image x={0} y={0} width={width} height={height} image={image} fit="cover" />
      <Fill opacity={dimOverlayOpacity} color="rgba(26, 26, 26, 0.75)" />
      <BackdropBlur blur={200} />
      <RoundedRect opacity={stepIndex} x={0} y={0} width={width} height={height} r={42}>
        <Paint color={'rgba(245, 248, 255, 0.06)'} style="stroke" strokeWidth={THICK_BORDER_WIDTH} />
        <Shadow dx={0} dy={0} blur={20} color={shadowColor} inner shadowOnly />
        <Shadow dx={0} dy={0} blur={2} color={shadowColor} inner shadowOnly />
      </RoundedRect>

      {/* More efficient, but opacity prop does not apply to children */}
      {/* <Box opacity={stepIndex} box={rrect(rect(0, 0, width, height), 42, 42)}>
        <Paint color={'rgba(245, 248, 255, 0.06)'} style="stroke" strokeWidth={THICK_BORDER_WIDTH} />
        <BoxShadow dx={0} dy={0} blur={40} spread={-2} color={shadowColor} inner />
        <BoxShadow dx={0} dy={0} blur={4} spread={2} color={shadowColor} inner />
      </Box> */}
    </Canvas>
  );
}
