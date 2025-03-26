import React, { useMemo, memo } from 'react';
import { Canvas, Shadow, Group, Path } from '@shopify/react-native-skia';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import Animated, { interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useForegroundColor } from '@/design-system';
import { getSquirclePath } from '@/components/cards/skia-cards/SkiaCard';

export const StepBorderEffects = memo(function StepBorderEffects({ width, height }: { width: number; height: number }) {
  const separatorSecondaryColor = useForegroundColor('separatorSecondary');
  const { accentColors } = useTokenLauncherContext();
  const stepAnimatedSharedValue = useTokenLauncherStore(state => state.stepAnimatedSharedValue);
  const shadowColor = accentColors.opacity20;

  const { innerSquirclePath, outerSquirclePath } = useMemo(() => {
    return {
      innerSquirclePath: getSquirclePath({
        borderRadius: 42 - THICK_BORDER_WIDTH / 2,
        height: height - THICK_BORDER_WIDTH,
        width: width - THICK_BORDER_WIDTH,
      }),
      outerSquirclePath: getSquirclePath({
        borderRadius: 42,
        height: height,
        width: width,
      }),
    };
  }, [width, height]);

  const reviewAndCreatingStepEffectsOpacity = useDerivedValue(() => {
    return interpolate(
      stepAnimatedSharedValue.value,
      [NavigationSteps.INFO, NavigationSteps.REVIEW, NavigationSteps.CREATING, NavigationSteps.SUCCESS],
      [0, 1, 1, 0],
      'clamp'
    );
  });

  const successStepEffectsOpacity = useDerivedValue(() =>
    interpolate(stepAnimatedSharedValue.value, [NavigationSteps.CREATING, NavigationSteps.SUCCESS], [0, 1], 'clamp')
  );

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [0, 1], 'clamp'),
  }));

  // Looks nicer, but trying to optimize the performance right now. Potentially add back in later.
  // const innerShadowOneBlur = useDerivedValue(() => {
  //   return interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [0, 10], Extrapolation.CLAMP);
  // });
  // const innerShadowTwoBlur = useDerivedValue(() => {
  //   return interpolate(stepAnimatedSharedValue.value, [NavigationSteps.INFO, NavigationSteps.REVIEW], [0, 2], Extrapolation.CLAMP);
  // });

  return (
    <Animated.View style={[{ height, width }, containerStyle]}>
      <Canvas style={{ height, width }}>
        <Path
          color={separatorSecondaryColor}
          path={innerSquirclePath}
          strokeWidth={THICK_BORDER_WIDTH}
          style="stroke"
          transform={[{ translateX: THICK_BORDER_WIDTH / 2 }, { translateY: THICK_BORDER_WIDTH / 2 }]}
        />
        <Group antiAlias dither opacity={reviewAndCreatingStepEffectsOpacity}>
          <Path path={outerSquirclePath}>
            <Shadow dx={0} dy={0} blur={20 / 2} color={shadowColor} inner shadowOnly />
          </Path>
          <Path path={innerSquirclePath}>
            <Shadow dx={0} dy={0} blur={4 / 2} color={shadowColor} inner shadowOnly />
          </Path>
        </Group>
        <Group opacity={successStepEffectsOpacity}>
          <Path path={outerSquirclePath} strokeWidth={4 * 2} style="stroke" color={'rgba(255, 255, 255, 0.1)'} />
          <Path path={outerSquirclePath} blendMode={'plus'}>
            <Shadow dx={0} dy={0} blur={8} color={'rgba(255, 255, 255, 0.4)'} inner shadowOnly />
          </Path>
        </Group>

        {/* More efficient, but opacity prop is broken on BoxShadow in react-native-skia <1.10.0 */}
        {/* <Group opacity={innerShadowsOpacity}>
        <Path path={squirclePath} color="transparent">
          <Shadow dx={0} dy={0} blur={innerShadowOneBlur} spread={2} color={shadowColor} inner />
        </Path>
        <Path path={squirclePath} color="transparent">
          <Shadow dx={0} dy={0} blur={innerShadowTwoBlur} spread={-2} color={shadowColor} inner />
        </Path>
      </Group> */}
      </Canvas>
    </Animated.View>
  );
});
