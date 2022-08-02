import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { usePagerPosition } from '../../navigation/ScrollPositionContext';

import ExchangeFloatingPanels from './ExchangeFloatingPanels';

const AnimatedPanels = Animated.createAnimatedComponent(ExchangeFloatingPanels);

export default function AnimatedExchangeFloatingPanels(props) {
  const scrollPosition = usePagerPosition();
  const style = useAnimatedStyle(() => {
    return {
      flexGrow: 1,
      justifyContent: 'center',
      opacity: android ? 1 : 1 - (scrollPosition.value || 0),
      transform: [
        { scale: android ? 1 : 1 - scrollPosition.value / 10 },
        { translateX: android ? 1 : scrollPosition.value * -8 },
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
