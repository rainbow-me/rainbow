import PropTypes from 'prop-types';
import React from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { useMemoOne } from 'use-memo-one';
import { interpolate, timing } from '../animations';
import { Emoji } from '../text';

const { add, concat, multiply, sin } = Animated;

const FloatingEmoji = ({
  distance,
  duration,
  emoji,
  fadeOut,
  index,
  left,
  scaleTo,
  size,
  top,
  wiggleFactor,
}) => {
  const { opacity, rotate, scale, translateX, translateY } = useMemoOne(() => {
    const animation = timing({ duration, easing: Easing.elastic() });
    const progress = interpolate(animation, {
      inputRange: [0, 1],
      outputRange: [0, distance],
    });

    return {
      opacity: interpolate(progress, {
        inputRange: [0, distance / 2, distance - size],
        outputRange: [1, fadeOut ? 0.89 : 1, fadeOut ? 0 : 1],
      }),
      rotate: concat(
        interpolate(progress, {
          inputRange: [0, distance / 4, distance / 3, distance / 2, distance],
          outputRange: [0, -2, 0, 2, 0],
        }),
        'deg'
      ),
      scale: interpolate(progress, {
        inputRange: [0, 15, 30, 50, distance],
        outputRange: [0, 1.2, 1.1, 1, scaleTo],
      }),
      translateX: add(
        multiply(
          animation,
          size,
          index % 3 === 0 ? 3 : 2,
          index % 2 === 0 ? -1 : 1
        ),
        multiply(
          sin(multiply(progress, distance / (350 / 15))), // i rly dont understand math plz help
          interpolate(progress, {
            inputRange: [0, distance / 10, distance],
            outputRange: [
              10 * wiggleFactor,
              6.9 * wiggleFactor,
              4.2069 * wiggleFactor,
            ],
          })
        )
      ),
      translateY: multiply(animation, distance, -1),
    };
  }, []);

  return (
    <Animated.View
      style={{
        left,
        opacity,
        position: 'absolute',
        top: top || size * -0.5,
        transform: [{ rotate }, { scale }, { translateX }, { translateY }],
      }}
    >
      <Emoji name={emoji} size={size} />
    </Animated.View>
  );
};

FloatingEmoji.propTypes = {
  distance: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  emoji: PropTypes.string.isRequired,
  fadeOut: PropTypes.bool,
  left: PropTypes.string.isRequired,
  scaleTo: PropTypes.number.isRequired,
  size: PropTypes.string.isRequired,
  top: PropTypes.number,
  wiggleFactor: PropTypes.number,
};

const neverRerender = () => true;
export default React.memo(FloatingEmoji, neverRerender);
