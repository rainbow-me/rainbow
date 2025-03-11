import React, { useMemo, memo } from 'react';

import { Canvas, Shadow, rect, rrect, Box, Group } from '@shopify/react-native-skia';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { Extrapolation, interpolate, useDerivedValue } from 'react-native-reanimated';
import { useForegroundColor } from '@/design-system';

export const StepBorderEffects = memo(function StepBorderEffects({ width, height }: { width: number; height: number }) {
  const separatorSecondaryColor = useForegroundColor('separatorSecondary');
  const { accentColors } = useTokenLauncherContext();
  const stepAnimatedSharedValue = useTokenLauncherStore(state => state.stepAnimatedSharedValue);
  const shadowColor = accentColors.opacity20;

  const roundedRect = useMemo(() => {
    return rrect(rect(0, 0, width, height), 42, 42);
  }, [width, height]);

  const reviewAndCreatingStepEffectsOpacity = useDerivedValue(() => {
    return interpolate(
      stepAnimatedSharedValue.value,
      [NavigationSteps.INFO, NavigationSteps.REVIEW, NavigationSteps.CREATING, NavigationSteps.SUCCESS],
      [0, 1, 1, 0],
      Extrapolation.CLAMP
    );
  });

  const innerShadowOneBlur = useDerivedValue(() => {
    return interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [0, 10], Extrapolation.CLAMP);
  });

  const innerShadowTwoBlur = useDerivedValue(() => {
    return interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [0, 2], Extrapolation.CLAMP);
  });

  const successStepEffectsOpacity = useDerivedValue(() => {
    return interpolate(stepAnimatedSharedValue.value, [NavigationSteps.CREATING, NavigationSteps.SUCCESS], [0, 1], Extrapolation.CLAMP);
  });

  return (
    <Canvas style={{ width, height }}>
      <Box box={roundedRect} strokeWidth={THICK_BORDER_WIDTH * 2} style="stroke" color={separatorSecondaryColor} />
      <Group antiAlias dither opacity={reviewAndCreatingStepEffectsOpacity}>
        <Box box={roundedRect}>
          <Shadow dx={0} dy={0} blur={innerShadowOneBlur} color={shadowColor} inner shadowOnly />
        </Box>
        <Box box={roundedRect}>
          <Shadow dx={0} dy={0} blur={innerShadowTwoBlur} color={shadowColor} inner shadowOnly />
        </Box>
      </Group>
      <Group opacity={successStepEffectsOpacity}>
        <Box box={roundedRect} strokeWidth={4 * 2} style="stroke" color={'rgba(255, 255, 255, 0.1)'} />
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
