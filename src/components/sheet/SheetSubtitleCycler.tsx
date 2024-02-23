import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming, SharedValue } from 'react-native-reanimated';
import { Centered } from '../layout';
import { SheetSubtitleCyclerItem } from './SheetSubtitleCyclerItem';
import { useInterval, useTimeout } from '@/hooks';

interface Props {
  sharedValue: SharedValue<number>;
  errorIndex: number;
  interval?: number;
  isPaymentComplete?: boolean;
  items: [string, string];
}

const SheetSubtitleCycler = ({ sharedValue, errorIndex, items, isPaymentComplete, interval = 3000 }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fadeOutAnimation = useSharedValue(isPaymentComplete ? 0 : 1);

  useLayoutEffect(() => {
    fadeOutAnimation.value = withTiming(isPaymentComplete ? 0 : 1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
  }, [isPaymentComplete, fadeOutAnimation]);

  const [startInterval, stopInterval] = useInterval();
  const [startTimeout, stopTimeout] = useTimeout();
  const clearTimers = useCallback(() => {
    stopInterval();
    stopTimeout();
  }, [stopInterval, stopTimeout]);

  const cycleTextOnce = useCallback(() => setSelectedIndex(i => (i + 1) % items.length), [items]);

  const startCycling = useCallback(() => startInterval(() => cycleTextOnce(), interval), [cycleTextOnce, interval, startInterval]);

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
    const scale = errorIndex !== null ? interpolate(sharedValue.value, [-20, -10, 0, 10, 20], [1.025, 1.25, 1, 1.25, 1.025], 'extend') : 1;

    return {
      transform: [{ scale }],
    };
  });

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: fadeOutAnimation.value,
  }));

  return (
    <Animated.View style={[scaleStyle, opacityStyle]}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <Centered paddingVertical={14} width="100%">
          {items.map((subtitle, index) => (
            <SheetSubtitleCyclerItem error={index === errorIndex} key={subtitle} selected={index === selectedIndex} subtitle={subtitle} />
          ))}
        </Centered>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default SheetSubtitleCycler;
