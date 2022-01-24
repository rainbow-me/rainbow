import {
  Canvas,
  interpolateColors,
  Paint,
  RadialGradient,
  Rect,
  SkiaView,
  useSharedValueEffect,
  vec,
} from '@shopify/react-native-skia';
import React, { useRef } from 'react';
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GradientInputProps } from './GradientInput';

const defaultGradients = {
  rainbow: ['#FFB114', '#FF54BB', '#00F0FF'],
  success: ['#FAFF00', '#2CCC00', '#2CCC00'],
  warning: ['#FFD963', '#FFB200', '#FFB200'],
};

const tintGradients = {
  rainbow: ['#fffaf1', '#fff5fb', '#f0feff'],
  success: ['#fffff0', '#fcfefb', '#fcfefb'],
  warning: ['#fffdf6', '#fffbf2', '#fffbf2'],
};

const AnimatedRadialGradient = ({
  variant,
  width,
  height,
  type = 'default',
}: {
  variant: GradientInputProps['variant'];
  width: number;
  height: number;
  type?: 'default' | 'tint';
}) => {
  const progress = useSharedValue(0);
  const canvasRef = useRef<SkiaView>(null);
  useSharedValueEffect(canvasRef, progress);

  const gradients = type === 'default' ? defaultGradients : tintGradients;

  const animatedGradients = React.useMemo(
    () => ({
      colors: () => [
        interpolateColors(
          progress.value,
          [-1, 0, 1],
          [gradients.warning[0], gradients.rainbow[0], gradients.success[0]]
        ),
        interpolateColors(
          progress.value,
          [-1, 0, 1],
          [gradients.warning[1], gradients.rainbow[1], gradients.success[1]]
        ),
        interpolateColors(
          progress.value,
          [-1, 0, 1],
          [gradients.warning[2], gradients.rainbow[2], gradients.success[2]]
        ),
      ],
      states: {
        rainbow: 0,
        success: 1,
        warning: -1,
      },
    }),
    [gradients.rainbow, gradients.success, gradients.warning, progress.value]
  );

  useAnimatedReaction(
    () => variant,
    (result, previous) => {
      if (result !== previous) {
        let nextValue = previous ? animatedGradients.states[result] : 0;

        progress.value = withTiming(nextValue, {
          duration: 200,
        });
      }
    },
    [variant]
  );

  return (
    <Canvas
      innerRef={canvasRef}
      style={{
        height: width,
        position: 'absolute',
        top: -(width - height) / 2,
        transform: [
          {
            scaleY: 0.7884615385,
          },
        ],
        width: width,
      }}
    >
      <Paint>
        <RadialGradient
          c={vec(width, width / 2)}
          colors={animatedGradients.colors}
          r={width}
        />
      </Paint>
      <Rect height={width} width={width} x={0} y={0} />
    </Canvas>
  );
};

export default AnimatedRadialGradient;
