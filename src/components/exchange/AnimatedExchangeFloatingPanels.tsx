import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { usePagerPosition } from '../../navigation/ScrollPositionContext';

import ExchangeFloatingPanels from './ExchangeFloatingPanels';

const AnimatedPanels = Animated.createAnimatedComponent(ExchangeFloatingPanels);

export default function AnimatedExchangeFloatingPanels(props: any) {
  const scrollPosition = usePagerPosition();
  const style = useAnimatedStyle(() => {
    return {
      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      opacity: 1 - (scrollPosition.value || 0),
      transform: [
        // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
        { scale: 1 - scrollPosition.value / 10 },
        // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
        { translateX: scrollPosition.value * -8 },
      ],
      width: '100%',
    };
  });

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View style={style}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AnimatedPanels {...props} />
    </Animated.View>
  );
}
