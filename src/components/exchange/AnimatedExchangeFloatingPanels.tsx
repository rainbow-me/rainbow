import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { usePagerPosition } from '../../navigation/ScrollPositionContext';

import ExchangeFloatingPanels from './ExchangeFloatingPanels';

const AnimatedPanels = Animated.createAnimatedComponent(ExchangeFloatingPanels);

export default function AnimatedExchangeFloatingPanels(props) {
  const scrollPosition = usePagerPosition();
  const style = useAnimatedStyle(() => {
    return {
      opacity: 1 - (scrollPosition.value || 0),
      transform: [
        { scale: 1 - scrollPosition.value / 10 },
        { translateX: scrollPosition.value * -8 },
      ],
      width: '100%',
    };
  });

  return (
    <Animated.View style={style}>
      <AnimatedPanels {...props} />
    </Animated.View>
  );
}
