import React from 'react';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Line, LineProps, Svg } from 'react-native-svg';
import { useChartData } from '../../helpers/useChartData';
import { FIX_CLIPPED_PATH_MAGIC_NUMBER } from './ChartPath';

interface ChartLineProps extends LineProps {
  color?: string;
  length: number;
  thickness: number;
}

function ChartLineFactory(orientation: 'horizontal' | 'vertical') {
  const isVertical = orientation === 'vertical';
  const ChartLine = React.memo(
    ({
      color = '#000000',
      thickness = 2,
      length,
      ...props
    }: ChartLineProps) => {
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
              left: 0,
              position: 'absolute',
              top: 0,
              width: isVertical ? thickness : length,
              zIndex: -1,
            },
          ]}
        >
          <Svg>
            <Line
              stroke={color}
              strokeDasharray={10}
              strokeWidth={thickness}
              x1={0}
              x2={isVertical ? 0 : length}
              y1={0}
              y2={isVertical ? length + FIX_CLIPPED_PATH_MAGIC_NUMBER : 0}
              {...props}
            />
          </Svg>
        </Animated.View>
      );
    }
  );

  ChartLine.displayName = 'ChartLine';

  return ChartLine;
}

export const CurrentPositionVerticalLine = ChartLineFactory('vertical');
export const OpeningPositionHorizontalLine = ChartLineFactory('horizontal');
