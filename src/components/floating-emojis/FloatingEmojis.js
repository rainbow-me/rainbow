import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { position } from '../../styles';
import FloatingEmoji from './FloatingEmoji';

const EMPTY_ARRAY = [];
const getRandomNumber = (min, max) => Math.random() * (max - min) + min;

const FloatingEmojis = ({
  children,
  distance,
  duration,
  emoji,
  fadeOut,
  opacity,
  range,
  scaleTo,
  size,
  wiggleFactor,
  ...props
}) => {
  const [emojis, setEmojis] = useState(EMPTY_ARRAY);

  const timeout = useRef(undefined);
  useEffect(() => () => timeout.current && clearTimeout(timeout.current), []);

  const clearEmojis = useCallback(() => setEmojis(EMPTY_ARRAY), []);

  // 🚧️ TODO: 🚧️
  // Clear emojis if page navigatorPosition falls below 0.93 (which we should call like `pageTransitionThreshold` or something)
  // otherwise, the FloatingEmojis look weird during stack transitions

  const onNewEmoji = useCallback(
    (x, y) => {
      // Set timeout to automatically clearEmojis after the latest one has finished animating
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(clearEmojis, duration * 1.1);

      setEmojis(existingEmojis => {
        const newEmoji = {
          // if a user has smashed the button 7 times, they deserve a 🌈 rainbow
          emojiToRender:
            (existingEmojis.length + 1) % 7 === 0 ? 'rainbow' : emoji,
          x: x ? x - getRandomNumber(-20, 20) : getRandomNumber(...range) + '%',
          y: y || 0,
        };
        return [...existingEmojis, newEmoji];
      });
    },
    [clearEmojis, duration, emoji, range, timeout]
  );

  return (
    <View zIndex={1} {...props}>
      {typeof children === 'function' ? children({ onNewEmoji }) : children}
      <Animated.View
        pointerEvents="none"
        style={{
          opacity,
          ...position.coverAsObject,
        }}
      >
        {emojis.map(({ emojiToRender, x, y }, index) => (
          <FloatingEmoji
            distance={Math.ceil(distance)}
            duration={duration}
            emoji={emojiToRender}
            fadeOut={fadeOut}
            index={index}
            key={`${x}${y}`}
            left={x}
            scaleTo={scaleTo}
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
  fadeOut: PropTypes.bool,
  opacity: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  range: PropTypes.arrayOf(PropTypes.number),
  scaleTo: PropTypes.number,
  size: PropTypes.string.isRequired,
  wiggleFactor: PropTypes.number,
};

FloatingEmojis.defaultProps = {
  distance: 130,
  duration: 2000,
  // Defaults the emoji to 👍️ (thumbs up).
  // To view complete list of emojis compatible with this component,
  // head to https://unicodey.com/emoji-data/table.htm and reference the
  // table's "Short Name" column.
  emoji: '+1',
  fadeOut: true,
  opacity: 1,
  range: [0, 80],
  scaleTo: 1,
  size: 30,
  wiggleFactor: 0.5,
};

export default FloatingEmojis;
