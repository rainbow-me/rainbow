import React, { useContext } from 'react';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Svg, Line, LineProps } from 'react-native-svg';
import { useChartData } from '../../helpers/useChartData';
import withReanimatedFallback from '../../helpers/withReanimatedFallback';
import { FIX_CLIPPED_PATH_MAGIC_NUMBER } from './ChartPath';

interface ChartLineProps extends LineProps {
  color?: string;
  length: number;
  thickness: number;
}

function ChartLineFactory(orientation: 'horizontal' | 'vertical') {
  const isVertical = orientation == 'vertical';
  return function ChartLine({
    color = '#000000',
    thickness = 2,
    length,
    ...props
  }: ChartLineProps) {
    const { positionX, dotScale, currentPath, height } = useChartData();

    const currentPositionVerticalLineStyle = useAnimatedStyle(
      () => ({
        opacity: dotScale.value,
        transform: [{ translateX: positionX.value }],
      }),
      []
    );

    const openingPositionHorizontalLineStyle = useAnimatedStyle(() => {
      const firstPoint = currentPath?.points?.[0];
      return {
        opacity: currentPath?.points.length === 0 ? 0 : 1,
        transform: [
          {
            translateY: withTiming(
              firstPoint ? firstPoint?.y * height + 10 : 0
            ),
          },
        ],
      };
    }, [currentPath]);
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          isVertical
            ? currentPositionVerticalLineStyle
            : openingPositionHorizontalLineStyle,
          {
            height: isVertical
              ? length + FIX_CLIPPED_PATH_MAGIC_NUMBER
              : thickness,
            position: 'absolute',
            left: 0,
            top: 0,
            width: isVertical ? thickness : length,
            zIndex: -1,
          },
        ]}
      >
        <Svg>
          <Line
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={10}
            x1={0}
            y1={0}
            x2={isVertical ? 0 : length}
            y2={isVertical ? length + FIX_CLIPPED_PATH_MAGIC_NUMBER : 0}
            {...props}
          />
        </Svg>
      </Animated.View>
    );
  };
}

export const CurrentPositionVerticalLine = withReanimatedFallback(
  ChartLineFactory('vertical')
);
export const OpeningPositionHorizontalLine = withReanimatedFallback(
  ChartLineFactory('horizontal')
);
