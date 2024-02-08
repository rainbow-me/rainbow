import React, { useEffect, useMemo, useState } from 'react';
import Animated, { Easing, EasingFunctionFactory, FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface AnimatePresenceProps {
  children: React.ReactNode;
  condition: boolean | null | undefined;
  duration?: number;
  easing?: EasingFunctionFactory;
  exitDuration?: number;
  exitEasing?: EasingFunctionFactory;
  enterAnimation?: typeof FadeIn;
}

const defaultTimingConfig = {
  duration: 225,
  easing: Easing.bezier(0.2, 0, 0, 1),
};

const exitTimingConfig = {
  duration: 125,
  easing: Easing.bezier(0.3, 0, 1, 1),
};

export const AnimatePresence = ({
  children,
  condition,
  duration = defaultTimingConfig.duration,
  easing = defaultTimingConfig.easing,
  exitEasing = exitTimingConfig.easing,
  exitDuration = exitTimingConfig.duration,
  enterAnimation = FadeIn,
}: AnimatePresenceProps) => {
  const [isMounted, setIsMounted] = useState(condition);
  const [isExiting, setIsExiting] = useState(false);

  const enterAnimationStyle = useMemo(() => {
    return enterAnimation.duration(duration).easing(easing.factory());
  }, [enterAnimation, duration, easing]);

  useEffect(() => {
    if (condition) {
      setIsExiting(false);
      setIsMounted(true);
    } else {
      setIsExiting(true);
      // Wait for exit animation completion
      setTimeout(() => {
        setIsMounted(false);
      }, exitDuration || duration);
    }
  }, [condition, duration, exitDuration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExiting ? 0 : 1, {
        duration: exitDuration,
        easing: exitEasing,
      }),
    };
  }, [isExiting, duration, easing]);

  return isMounted ? (
    <Animated.View entering={enterAnimationStyle} style={animatedStyle}>
      {children}
    </Animated.View>
  ) : null;
};
