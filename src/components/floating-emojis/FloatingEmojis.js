import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { position } from '../../styles';
import { interpolate } from '../animations';
import FloatingEmoji from './FloatingEmoji';

const { call, cond, lessThan, onChange, useCode } = Animated;

const EMPTY_ARRAY = [];
const pageTransitionThreshold = 0.93;

const getRandomNumber = (min, max) => Math.random() * (max - min) + min;

const FloatingEmojis = ({
  children,
  distance,
  duration,
  emoji,
  range,
  size,
  transitionPosition,
  wiggleFactor,
  ...props
}) => {
  const [emojis, setEmojis] = useState(EMPTY_ARRAY);
  const [touched, setTouched] = useState(false);

  const timeout = useRef(undefined);
  useEffect(() => () => timeout.current && clearTimeout(timeout.current), []);

  const clearEmojis = useCallback(() => setEmojis(EMPTY_ARRAY), [setEmojis]);

  // Clear emojis if page transitionPosition falls below `pageTransitionThreshold`
  // otherwise, the FloatingEmojis look weird during stack transitions
  useCode(
    ...(transitionPosition
      ? [
          onChange(
            lessThan(transitionPosition, pageTransitionThreshold),
            cond(
              lessThan(transitionPosition, pageTransitionThreshold),
              call([], clearEmojis)
            )
          ),
        ]
      : [])
  );

  const onNewEmoji = useCallback(
    (x, y) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(clearEmojis, duration * 1.1);

      const newEmoji = {
        // if a user has smashed the button 7 times, they deserve a 🌈️ rainbow
        emojiToRender: touched && emojis.length % 7 === 0 ? 'rainbow' : emoji,
        x: x ? x - getRandomNumber(-20, 20) : `${getRandomNumber(...range)}%`,
        y: y || 0,
      };

      setEmojis([...emojis, newEmoji]);
      if (!touched) setTouched(true);
    },
    [
      clearEmojis,
      duration,
      emoji,
      emojis,
      range,
      setEmojis,
      setTouched,
      timeout,
      touched,
    ]
  );

  return (
    <View {...props}>
      {children({ onNewEmoji })}
      <Animated.View
        pointerEvents="none"
        style={{
          ...position.coverAsObject,
          opacity: !transitionPosition
            ? 1
            : interpolate(transitionPosition, {
                inputRange: [pageTransitionThreshold, 1],
                outputRange: [0, 1],
              }),
        }}
      >
        {emojis.map(({ emojiToRender, x, y }, index) => (
          <FloatingEmoji
            distance={Math.ceil(distance)}
            duration={duration}
            emoji={emojiToRender}
            index={index}
            key={`${x}${y}`}
            left={x}
            size={size}
            top={y}
            wiggleFactor={wiggleFactor}
          />
        ))}
      </Animated.View>
    </View>
  );
};

FloatingEmojis.propTypes = {
  children: PropTypes.node,
  distance: PropTypes.number,
  duration: PropTypes.number,
  emoji: PropTypes.string.isRequired,
  range: PropTypes.arrayOf(PropTypes.number),
  size: PropTypes.string.isRequired,
  transitionPosition: PropTypes.object,
  wiggleFactor: PropTypes.number,
};

FloatingEmojis.defaultProps = {
  distance: 130,
  duration: 2000,
  emoji: '+1', // aka 👍️
  range: [0, 80],
  size: 30,
  wiggleFactor: 0.5,
};

export default FloatingEmojis;
