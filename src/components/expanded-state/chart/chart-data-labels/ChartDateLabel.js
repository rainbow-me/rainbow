import React from 'react';
import Animated from 'react-native-reanimated';
import { Input } from '../../../inputs';
import ChartHeaderSubtitle from './ChartHeaderSubtitle';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';

const AnimatedSubtitle = Animated.createAnimatedComponent(ChartHeaderSubtitle);

export default function ChartDateLabel({ color, dateRef }) {
  return chartExpandedAvailable ? (
    <AnimatedSubtitle
      align="right"
      as={Input}
      color={color}
      editable={false}
      letterSpacing="roundedTight"
      pointerEvent="none"
      ref={dateRef}
      tabularNums
    />
  ) : (
    <AnimatedSubtitle align="right" color={color}>
      Today
    </AnimatedSubtitle>
  );
}
