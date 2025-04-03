import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  WithSpringConfig,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';
import { useChartData } from '../../helpers/useChartData';
import { FIX_CLIPPED_PATH_FOR_CARD_MAGIC_NUMBER, FIX_CLIPPED_PATH_MAGIC_NUMBER, timingAnimationDefaultConfig } from './ChartPath';

const springDefaultConfig = {
  damping: 15,
  mass: 1,
  stiffness: 600,
};

const PULSE_DURATION = 1250;
const PULSE_DELAY = 750;
const PULSE_START_OPACITY = 0.5;
const PULSE_END_SCALE = 4;

interface ChartDotProps {
  color: string;
  dotStyle?: StyleProp<ViewStyle>;
  size?: number;
  springConfig?: WithSpringConfig;
  timingAnimationConfig?: WithTimingConfig;
  pulseDelay?: number;
  pulseDuration?: number;
  pulseStartOpacity?: number;
  pulseEndScale?: number;
  isCard?: boolean;
}

const ChartDot = React.memo(
  ({
    size = 10,
    color,
    pulseDelay = PULSE_DELAY,
    pulseDuration = PULSE_DURATION,
    pulseStartOpacity = PULSE_START_OPACITY,
    pulseEndScale = PULSE_END_SCALE,
    springConfig = springDefaultConfig,
    timingAnimationConfig = timingAnimationDefaultConfig,
    dotStyle,
    isCard,
  }: ChartDotProps) => {
    const { isActive, positionX, positionY, currentPath, stroke, selectedStroke } = useChartData();
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(pulseStartOpacity);

    const pulseSize = size * pulseEndScale;
    const lastPoint = currentPath?.points[currentPath.points.length - 1];
    const magicNudgeNumber = isCard ? FIX_CLIPPED_PATH_FOR_CARD_MAGIC_NUMBER : FIX_CLIPPED_PATH_MAGIC_NUMBER;

    const startPulseAnimation = useCallback(() => {
      'worklet';
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0, { duration: pulseDuration }), withDelay(pulseDelay, withTiming(pulseStartOpacity, { duration: 0 }))),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(withTiming(pulseEndScale, { duration: pulseDuration }), withDelay(pulseDelay, withTiming(1, { duration: 0 }))),
        -1,
        true
      );
    }, [pulseOpacity, pulseScale, pulseDelay, pulseDuration, pulseStartOpacity, pulseEndScale]);

    const stopPulseAnimation = useCallback(() => {
      'worklet';
      pulseOpacity.value = 0;
      pulseScale.value = 1;
    }, [pulseOpacity, pulseScale]);

    useAnimatedReaction(
      () => isActive.value,
      isActive => {
        if (isActive) {
          stopPulseAnimation();
        } else {
          startPulseAnimation();
        }
      }
    );

    useEffect(() => {
      runOnUI(startPulseAnimation)();
    }, [startPulseAnimation]);

    const touchPointStyle = useAnimatedStyle(() => {
      const translateX = positionX.value;
      const translateY = positionY.value + magicNudgeNumber / 2;
      const scale = withSpring(isActive.value ? 1 : 0, springConfig);
      return {
        opacity: isActive.value ? 1 : 0,
        transform: [{ translateX }, { translateY }, { scale }],
      };
    }, [size]);

    const dotPulseAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: pulseOpacity.value,
        transform: [{ scale: pulseScale.value }],
      };
    });

    const lastPointDotAnimatedStyle = useAnimatedStyle(() => {
      return {
        backgroundColor: isActive.value ? selectedStroke : stroke,
      };
    });

    const lastPointDotStyle = useAnimatedStyle(() => {
      // It's best to always return the same shape of style object, but in this case don't want the first translation animating
      if (!lastPoint) {
        return {
          opacity: 0,
        };
      }
      const lastPointX = lastPoint.x;
      const lastPointY = lastPoint.y + magicNudgeNumber / 2;

      const translateX = withTiming(lastPointX, timingAnimationConfig);
      const translateY = withTiming(lastPointY, timingAnimationConfig);

      return {
        transform: [{ translateX }, { translateY }],
        opacity: 1,
      };
    }, [lastPoint]);

    const styles: Record<string, ViewStyle> = useMemo(() => {
      return {
        pointContainerStyle: {
          height: size,
          position: 'absolute',
          width: size,
          left: -size / 2,
          top: -size / 2,
        },
        dotPulseStyle: {
          width: size,
          height: size,
          position: 'absolute',
          backgroundColor: color,
          borderRadius: size / 2,
        },
        touchDotRingStyle: {
          position: 'absolute',
          left: -pulseSize / 2 + size / 2,
          top: -pulseSize / 2 + size / 2,
          width: pulseSize,
          height: pulseSize,
          backgroundColor: color,
          opacity: 0.06,
          borderRadius: pulseSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        touchDotStyle: {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      };
    }, [size, color, pulseSize]);

    return (
      <>
        <Animated.View pointerEvents="none" style={[styles.pointContainerStyle, lastPointDotStyle]}>
          <Animated.View style={[styles.dotPulseStyle, dotPulseAnimatedStyle]} />
          <Animated.View
            style={[
              lastPointDotAnimatedStyle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
              dotStyle,
            ]}
          />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.pointContainerStyle, touchPointStyle]}>
          <View style={styles.touchDotRingStyle} />
          <View style={[styles.touchDotStyle, dotStyle]} />
        </Animated.View>
      </>
    );
  }
);

ChartDot.displayName = 'ChartDot';

export default ChartDot;
