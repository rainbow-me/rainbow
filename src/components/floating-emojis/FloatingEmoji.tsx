import React, { useLayoutEffect } from 'react';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Emoji } from '../text';

interface FloatingEmojiProps {
  centerVertically?: boolean;
  disableHorizontalMovement?: boolean;
  disableVerticalMovement?: boolean;
  distance: number;
  duration: number;
  emoji: string;
  fadeOut?: boolean;
  index: number;
  left: number;
  marginTop?: number;
  opacityThreshold?: number;
  scaleTo: number;
  size: string;
  top?: number;
  wiggleFactor?: number;
}

const FloatingEmoji: React.FC<FloatingEmojiProps> = ({
  centerVertically,
  disableHorizontalMovement,
  disableVerticalMovement,
  distance,
  duration,
  emoji,
  fadeOut,
  index,
  left,
  marginTop,
  opacityThreshold,
  scaleTo,
  size,
  top,
  wiggleFactor,
}) => {
  const animation = useSharedValue(0);

  useLayoutEffect(() => {
    animation.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(animation.value, [0, 1], [0, distance]);

    const opacity = interpolate(
      progress,
      [0, distance * (opacityThreshold ?? 0.5), distance - Number(size)],
      [1, fadeOut ? 0.89 : 1, fadeOut ? 0 : 1]
    );

    const rotate = interpolate(progress, [0, distance / 4, distance / 3, distance / 2, distance], [0, -2, 0, 2, 0]) + 'deg';

    const scale = interpolate(progress, [0, 15, 30, 50, distance], [0, 1.2, 1.1, 1, scaleTo]);

    const everyThirdEmojiMultiplier = index % 3 === 0 ? 3 : 2;
    const everySecondEmojiMultiplier = index % 2 === 0 ? -1 : 1;

    // Horizontal movement
    const translateXComponentA = animation.value * Number(size) * everySecondEmojiMultiplier * everyThirdEmojiMultiplier;

    // "Wiggle" calculations
    const wiggleMultiplierA = Math.sin(progress * (distance / 23.3));
    const wiggleMultiplierB = interpolate(
      progress,
      [0, distance / 10, distance],
      [10 * (wiggleFactor ?? 1), 6.9 * (wiggleFactor ?? 1), 4.2137 * (wiggleFactor ?? 1)]
    );
    const translateXComponentB = wiggleMultiplierA * wiggleMultiplierB;

    const translateX = disableHorizontalMovement ? 0 : translateXComponentA + translateXComponentB;

    // Vertical movement
    const translateY = disableVerticalMovement ? 0 : -progress;

    return {
      opacity,
      transform: [{ rotate }, { scale }, { translateX }, { translateY }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          left,
          marginTop,
          position: 'absolute',
          top: centerVertically ? undefined : top ?? Number(size) * -0.5,
        },
        animatedStyle,
      ]}
    >
      <Emoji name={emoji} />
    </Animated.View>
  );
};

const neverRerender = (): boolean => true;

export default React.memo(FloatingEmoji, neverRerender);
