import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useChartData } from '../../helpers/useChartData';
import withReanimatedFallback from '../../helpers/withReanimatedFallback';

interface ChartDotProps {
  style?: ViewStyle;
  springConfig?: Animated.WithSpringConfig;
}

const springDefaultConfig = {
  damping: 15,
  mass: 1,
  stiffness: 600,
};

const CURSOR = 16;

const ChartDot: React.FC<ChartDotProps> = ({ style, springConfig }) => {
  const { isActive, positionX, positionY } = useChartData();

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = positionX.value - CURSOR / 2;
    const translateY = positionY.value - CURSOR / 2;

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
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill]}>
      <Animated.View style={[styles.cursorBody, style, animatedStyle]} />
    </Animated.View>
  );
};

export default withReanimatedFallback(ChartDot);
