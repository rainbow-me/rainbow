import React from 'react';
import Animated from 'react-native-reanimated';
import { Input } from '../../../inputs';
import { RowWithMargins } from '../../../layout';
import ChartChangeDirectionArrow from './ChartChangeDirectionArrow';
import ChartHeaderTitle from './ChartHeaderTitle';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';

const AnimatedTitle = Animated.createAnimatedComponent(ChartHeaderTitle);

export default function ChartPercentChangeLabel({
  changeDirection,
  changeRef,
  color,
  latestChange,
  tabularNums,
}) {
  return (
    <RowWithMargins align="center" margin={4}>
      <ChartChangeDirectionArrow
        changeDirection={changeDirection}
        color={color}
      />
      {chartExpandedAvailable ? (
        <AnimatedTitle
          align="right"
          as={Input}
          color={color}
          editable={false}
          pointerEvent="none"
          ref={changeRef}
          tabularNums={tabularNums}
        />
      ) : (
        <AnimatedTitle align="right" color={color}>
          {latestChange}
        </AnimatedTitle>
      )}
    </RowWithMargins>
  );
}
