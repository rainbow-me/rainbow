import React, { memo } from 'react';
import { Canvas, Image, Fill, BackdropBlur, Group, Paint, BlendColor, Blur } from '@shopify/react-native-skia';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { Extrapolation, interpolate, useDerivedValue } from 'react-native-reanimated';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { opacity } from '@/__swaps__/utils/swaps';
import { globalColors } from '@/design-system/color/palettes';

export const StepBlurredImageBackground = memo(function StepBlurredImageBackground({ width, height }: { width: number; height: number }) {
  const { tokenBackgroundImage } = useTokenLauncherContext();
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const stepAnimatedSharedValue = useTokenLauncherStore(state => state.stepAnimatedSharedValue);

  const dimOverlayOpacity = useDerivedValue(() => {
    return interpolate(stepAnimatedSharedValue.value, [NavigationSteps.CREATING, NavigationSteps.SUCCESS], [1, 0], Extrapolation.CLAMP);
  });

  if (!tokenBackgroundImage || !imageUri) return null;

  return (
    <Canvas style={{ width, height }}>
      <Image x={0} y={0} width={width} height={height} image={tokenBackgroundImage} fit="cover" />
      <BackdropBlur antiAlias dither blur={100} clip={{ x: 0, y: 0, width: width, height: height }}>
        <Fill opacity={dimOverlayOpacity} antiAlias dither color="rgba(26, 26, 26, 0.75)" />
      </BackdropBlur>
      {/* TODO: might be solution for haloing */}
      {/* <Group
        layer={
          <Paint antiAlias dither>
            <BlendColor mode="srcOver" color={opacity('rgba(26, 26, 26, 1)', 0.75)} />
            <Blur blur={100} />
          </Paint>
        }
      >
        <Image height={height} image={tokenBackgroundImage} width={width} x={0} y={0} />
      </Group> */}
    </Canvas>
  );
});
