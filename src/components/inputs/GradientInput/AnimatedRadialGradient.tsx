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
import React, { useMemo, useRef } from 'react';
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GradientInputProps } from './GradientInput';
import { Box } from '@rainbow-me/design-system';

const gradientSets = {
  default: {
    rainbow: ['#FFB114', '#FF54BB', '#00F0FF'],
    success: ['#FAFF00', '#2CCC00', '#2CCC00'],
    warning: ['#FFD963', '#FFB200', '#FFB200'],
  },
  tint: {
    rainbow: ['#fffaf1', '#fff5fb', '#f0feff'],
    success: ['#fffff0', '#fcfefb', '#fcfefb'],
    warning: ['#fffdf6', '#fffbf2', '#fffbf2'],
  },
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

  const gradients = gradientSets[type];

  const animatedStates = useMemo(
    () => ({
      rainbow: 0,
      success: 1,
      warning: -1,
    }),
    []
  );

  const animatedColors = useMemo(
    () => () => [
      interpolateColors(
        progress.value,
        [
          animatedStates.warning,
          animatedStates.rainbow,
          animatedStates.success,
        ],
        [gradients.warning[0], gradients.rainbow[0], gradients.success[0]]
      ),
      interpolateColors(
        progress.value,
        [
          animatedStates.warning,
          animatedStates.rainbow,
          animatedStates.success,
        ],
        [gradients.warning[1], gradients.rainbow[1], gradients.success[1]]
      ),
      interpolateColors(
        progress.value,
        [
          animatedStates.warning,
          animatedStates.rainbow,
          animatedStates.success,
        ],
        [gradients.warning[2], gradients.rainbow[2], gradients.success[2]]
      ),
    ],
    [
      animatedStates.rainbow,
      animatedStates.success,
      animatedStates.warning,
      gradients.rainbow,
      gradients.success,
      gradients.warning,
      progress.value,
    ]
  );

  useAnimatedReaction(
    () => variant,
    (result, previous) => {
      if (result !== previous) {
        let nextValue = previous ? animatedStates[result] : 0;

        progress.value = withTiming(nextValue, {
          duration: 200,
        });
      }
    },
    [variant]
  );

  return (
    <Box
      as={Canvas}
      innerRef={canvasRef}
      style={useMemo(
        () => ({
          height: width,
          position: 'absolute' as 'absolute',
          top: -(width - height) / 2,
          transform: [
            {
              scaleY: 0.7884615385,
            },
          ],
          width: width,
        }),
        [height, width]
      )}
    >
      <Paint>
        <RadialGradient
          c={useMemo(() => vec(width, width / 2), [width])}
          colors={animatedColors}
          r={width}
        />
      </Paint>
      <Rect height={width} width={width} x={0} y={0} />
    </Box>
  );
};

export default AnimatedRadialGradient;
