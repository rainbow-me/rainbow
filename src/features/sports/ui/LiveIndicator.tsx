import { useEffect, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { easing } from '@/components/animations/animationConfigs';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { opacity } from '@/design-system/utils/opacity';
import { time } from '@/framework/core/utils/time';

const PULSE_CONFIG = { duration: time.seconds(1.8), easing: easing.inOut.ease };

/**
 * Live dot indicator with an optional animated, pulsing ring.
 */
export function LiveIndicator({ animated = true }: { animated?: boolean }): ReactElement {
  const red = useForegroundColor('red');
  const ringColor = opacity(red, 0.3);

  return (
    <View style={styles.icon}>
      {animated ? <AnimatedRing color={ringColor} /> : <View style={[styles.ring, { borderColor: ringColor }]} />}
      <View style={[styles.dot, { backgroundColor: red }]} />
    </View>
  );
}

function AnimatedRing({ color }: { color: string }): ReactElement {
  const pulse = useSharedValue(0);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value * 0.3,
    transform: [{ scale: 1 + pulse.value * 0.1025 }],
  }));

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, PULSE_CONFIG), -1, true);
    return () => cancelAnimation(pulse);
  }, [pulse]);

  return <Animated.View style={[styles.ring, { borderColor: color }, ringStyle]} />;
}

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
