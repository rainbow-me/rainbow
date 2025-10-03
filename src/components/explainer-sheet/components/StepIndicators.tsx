import React, { memo } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Box } from '@/design-system';

type StepIndicatorDotProps = {
  index: number;
  currentIndex: SharedValue<number>;
  size: number;
  color: string;
  activeScale: number;
  inactiveOpacity: number;
  inactiveScale: number;
};

const StepIndicatorDot = memo(function StepIndicatorDot({
  index,
  currentIndex,
  size,
  color,
  activeScale,
  inactiveOpacity,
  inactiveScale,
}: StepIndicatorDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      currentIndex.value,
      [index - 2, index - 1, index, index + 1, index + 2],
      [inactiveScale * size, size, activeScale * size, size, inactiveScale * size],
      Extrapolation.CLAMP
    );
    const height = interpolate(
      currentIndex.value,
      [index - 2, index - 1, index, index + 1, index + 2],
      [inactiveScale * size, size, size, size, inactiveScale * size],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      currentIndex.value,
      [index - 1, index, index + 1],
      [inactiveOpacity, 1, inactiveOpacity],
      Extrapolation.CLAMP
    );

    return {
      width,
      height,
      opacity,
    };
  });

  return <Animated.View style={[{ borderRadius: size / 2, backgroundColor: color }, animatedStyle]} />;
});

type StepIndicatorsProps = {
  stepCount: number;
  currentIndex: SharedValue<number>;
  size?: number;
  activeScale?: number;
  inactiveOpacity?: number;
  inactiveScale?: number;
  gap?: number;
  color?: string;
};

export const StepIndicators = memo(function StepIndicators({
  stepCount,
  currentIndex,
  size = 6,
  activeScale = 7 / 3,
  inactiveOpacity = 0.2,
  inactiveScale = 0.8,
  gap = 4,
  color = 'white',
}: StepIndicatorsProps) {
  return (
    <Box flexDirection="row" gap={gap} justifyContent="center" alignItems="center">
      {Array.from({ length: stepCount }).map((_, index) => (
        <StepIndicatorDot
          key={index}
          index={index}
          currentIndex={currentIndex}
          size={size}
          activeScale={activeScale}
          inactiveOpacity={inactiveOpacity}
          inactiveScale={inactiveScale}
          color={color}
        />
      ))}
    </Box>
  );
});
