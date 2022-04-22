import React from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import { useChartData } from '../../helpers/useChartData';
import { FIX_CLIPPED_PATH_MAGIC_NUMBER } from './ChartPath';

interface ChartDotProps extends ViewProps {
  size?: number;
  springConfig?: WithSpringConfig;
}

const springDefaultConfig = {
  damping: 15,
  mass: 1,
  stiffness: 600,
};

const ChartDot = React.memo(
  ({ style, size = 10, springConfig, ...props }: ChartDotProps) => {
    const { isActive, positionX, positionY } = useChartData();

    const animatedStyle = useAnimatedStyle(() => {
      const translateX = positionX.value;
      const translateY = positionY.value + FIX_CLIPPED_PATH_MAGIC_NUMBER / 2;
      const animation = withSpring(
        isActive.value ? 1 : 0,
        springConfig || springDefaultConfig
      );

      return {
        opacity: positionY.value === -1 ? 0 : animation,
        transform: [
          { translateX },
          { translateY },
          {
            scale: animation,
          },
        ],
      };
    }, [size]);

    return (
      <Animated.View
        {...props}
        pointerEvents="none"
        style={[
          {
            borderRadius: size / 2,
            height: size,
            left: -size / 2,
            position: 'absolute',
            top: -size / 2,
            width: size,
          },
          animatedStyle,
          style,
        ]}
      />
    );
  }
);

ChartDot.displayName = 'ChartDot';

export default ChartDot;
