import PropTypes from 'prop-types';
import React from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { useMemoOne } from 'use-memo-one';
import { interpolate, timing } from '../animations';
import { Emoji } from '../text';

const { add, concat, multiply, sin } = Animated;

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
  const { opacity, rotate, scale, translateX, translateY } = useMemoOne(() => {
    const animation = timing({ duration, easing: Easing.elastic() });
    const progress = interpolate(animation, {
      inputRange: [0, 1],
      outputRange: [0, distance],
    });

    return {
      opacity: interpolate(progress, {
        inputRange: [0, distance * opacityThreshold || 0.5, distance - size],
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
        marginTop,
        opacity,
        position: 'absolute',
        top: centerVertically ? null : top || size * -0.5,
        transform: [
          { rotate },
          { scale },
          disableHorizontalMovement ? null : { translateX },
          disableVerticalMovement ? null : { translateY },
        ],
      }}
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
