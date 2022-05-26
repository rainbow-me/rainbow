import React, { useCallback, useEffect, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
import { SheetSubtitleCyclerItem } from './SheetSubtitleCyclerItem';

import { useInterval, useTimeout } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';

interface Props {
  sharedValue: Animated.SharedValue<number>;
  errorIndex: number;
  interval?: number;
  items: [string, string];
}

const SheetSubtitleCycler = ({
  sharedValue,
  errorIndex,
  items,
  interval = 3000,
}: Props) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [startInterval, stopInterval] = useInterval();
  const [startTimeout, stopTimeout] = useTimeout();
  const clearTimers = useCallback(() => {
    stopInterval();
    stopTimeout();
  }, [stopInterval, stopTimeout]);

  const cycleTextOnce = useCallback(
    () => setSelectedIndex(i => (i + 1) % items.length),
    [items]
  );

  const startCycling = useCallback(
    () => startInterval(() => cycleTextOnce(), interval),
    [cycleTextOnce, interval, startInterval]
  );

  useEffect(() => {
    if (errorIndex !== null) {
      clearTimers();
      setSelectedIndex(errorIndex);
    } else {
      stopInterval();
      startCycling();
    }
  }, [clearTimers, errorIndex, startCycling, stopInterval]);

  const handlePress = useCallback(() => {
    clearTimers();
    cycleTextOnce();
    startTimeout(() => startCycling(), interval);
  }, [clearTimers, cycleTextOnce, interval, startCycling, startTimeout]);

  const scaleStyle = useAnimatedStyle(() => {
    const scale =
      errorIndex !== null
        ? interpolate(
            sharedValue.value,
            [-20, -10, 0, 10, 20],
            [1.025, 1.25, 1, 1.25, 1.025],
            'extend'
          )
        : 1;

    return {
      transform: [{ scale }],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Centered paddingVertical={14} width="100%">
        <Animated.View {...position.coverAsObject} style={scaleStyle}>
          {items.map((subtitle, index) => (
            <SheetSubtitleCyclerItem
              error={index === errorIndex}
              key={subtitle}
              selected={index === selectedIndex}
              subtitle={subtitle}
            />
          ))}
        </Animated.View>
      </Centered>
    </TouchableWithoutFeedback>
  );
};

export default magicMemo(SheetSubtitleCycler, [
  'sharedValue',
  'errorIndex',
  'interval',
  'items',
]);
