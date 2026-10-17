import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { easing } from '@/components/animations/animationConfigs';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { opacity } from '@/design-system/utils/opacity';
import { time } from '@/framework/core/utils/time';

const PULSE_CONFIG = { duration: time.seconds(1.8), easing: easing.inOut.ease };

/**
 * Live dot indicator with a pulsing ring.
 */
export const LiveIndicator = memo(function LiveIndicator() {
  const red = useForegroundColor('red');
  const ringColor = opacity(red, 0.3);
  const pulse = useSharedValue(0);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value * 0.44,
    transform: [{ scale: 1 + pulse.value * 0.10825 }],
  }));

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, PULSE_CONFIG), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse]);

  return (
    <View style={styles.icon}>
      <Animated.View style={[styles.ring, { borderColor: ringColor }, ringStyle]} />
      <View style={[styles.dot, { backgroundColor: red }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  icon: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 6,
    overflow: 'hidden',
  },
});
