import React from 'react';
import { StyleSheet, ViewProps, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useChartData } from '../../helpers/useChartData';
import withReanimatedFallback from '../../helpers/withReanimatedFallback';

interface ChartDotProps extends ViewProps {
  size?: number;
  springConfig?: Animated.WithSpringConfig;
}

const springDefaultConfig = {
  damping: 15,
  mass: 1,
  stiffness: 600,
};

const ChartDot: React.FC<ChartDotProps> = ({
  style,
  size = 10,
  springConfig,
  ...props
}) => {
  const { isActive, positionX, positionY } = useChartData();

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = positionX.value;
    const translateY = positionY.value + 10;

    return {
      opacity: withSpring(
        isActive.value ? 1 : 0,
        springConfig || springDefaultConfig
      ),
      transform: [
        { translateX },
        { translateY },
        {
          scale: withSpring(
            isActive.value ? 1 : 0,
            springConfig || springDefaultConfig
          ),
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
};

export default withReanimatedFallback(ChartDot);
