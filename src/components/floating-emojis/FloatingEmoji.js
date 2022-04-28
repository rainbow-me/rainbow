import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Emoji } from '../text';

const FloatingEmoji = ({
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

  useEffect(() => {
    animation.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(animation.value, [0, 1], [0, distance]);

    const opacity = interpolate(
      progress,
      [0, distance * (opacityThreshold ?? 0.5), distance - size],
      [1, fadeOut ? 0.89 : 1, fadeOut ? 0 : 1]
    );

    const rotate =
      interpolate(
        progress,
        [0, distance / 4, distance / 3, distance / 2, distance],
        [0, -2, 0, 2, 0]
      ) + 'deg';

    const scale = interpolate(
      progress,
      [0, 15, 30, 50, distance],
      [0, 1.2, 1.1, 1, scaleTo]
    );

    const everyThirdEmojiMultiplier = index % 3 === 0 ? 3 : 2;
    const everySecondEmojiMultiplier = index % 2 === 0 ? -1 : 1;
    const translateXComponentA =
      animation.value *
      size *
      everySecondEmojiMultiplier *
      everyThirdEmojiMultiplier;

    const wiggleMultiplierA = Math.sin(progress * (distance / (350 / 15)));
    const wiggleMultiplierB = interpolate(
      progress,
      [0, distance / 10, distance],
      [10 * wiggleFactor, 6.9 * wiggleFactor, 4.2069 * wiggleFactor]
    );
    const translateXComponentB = wiggleMultiplierA * wiggleMultiplierB;

    const translateX = disableHorizontalMovement
      ? 0
      : translateXComponentA + translateXComponentB;

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
          top: centerVertically ? null : top || size * -0.5,
        },
        animatedStyle,
      ]}
    >
      <Emoji name={emoji} size={size} />
    </Animated.View>
  );
};
FloatingEmoji.propTypes = {
  centerVertically: PropTypes.bool,
  disableHorizontalMovement: PropTypes.bool,
  disableVerticalMovement: PropTypes.bool,
  distance: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  emoji: PropTypes.string.isRequired,
  fadeOut: PropTypes.bool,
  left: PropTypes.string.isRequired,
  marginTop: PropTypes.number,
  opacityThreshold: PropTypes.number,
  scaleTo: PropTypes.number.isRequired,
  size: PropTypes.string.isRequired,
  top: PropTypes.number,
  wiggleFactor: PropTypes.number,
};

const neverRerender = () => true;
export default React.memo(FloatingEmoji, neverRerender);
