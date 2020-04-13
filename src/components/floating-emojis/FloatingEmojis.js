import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { position } from '../../styles';
import FloatingEmoji from './FloatingEmoji';

const EMPTY_ARRAY = [];
const getEmoji = emojis => Math.floor(Math.random() * emojis.length);
const getRandomNumber = (min, max) => Math.random() * (max - min) + min;

const FloatingEmojis = ({
  centerVertically,
  children,
  disableHorizontalMovement,
  disableRainbow,
  disableVerticalMovement,
  distance,
  duration,
  emojis,
  fadeOut,
  marginTop,
  opacity,
  opacityThreshold,
  range,
  scaleTo,
  size,
  wiggleFactor,
  ...props
}) => {
  const [floatingEmojis, setEmojis] = useState(EMPTY_ARRAY);

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
            (existingEmojis.length + 1) % 7 === 0 && !disableRainbow
              ? 'rainbow'
              : emojis.length === 1
              ? emojis[0]
              : emojis[getEmoji(emojis)],
          x: x ? x - getRandomNumber(-20, 20) : getRandomNumber(...range) + '%',
          y: y || 0,
        };
        return [...existingEmojis, newEmoji];
      });
    },
    [clearEmojis, disableRainbow, duration, emojis, range]
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
        {floatingEmojis.map(({ emojiToRender, x, y }, index) => (
          <FloatingEmoji
            centerVertically={centerVertically}
            disableHorizontalMovement={disableHorizontalMovement}
            disableVerticalMovement={disableVerticalMovement}
            distance={Math.ceil(distance)}
            duration={duration}
            emoji={emojiToRender}
            fadeOut={fadeOut}
            index={index}
            key={`${x}${y}`}
            left={x}
            marginTop={marginTop}
            opacityThreshold={opacityThreshold}
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
  centerVertically: PropTypes.bool,
  children: PropTypes.node,
  disableHorizontalMovement: PropTypes.bool,
  disableRainbow: PropTypes.bool,
  disableVerticalMovement: PropTypes.bool,
  distance: PropTypes.number,
  duration: PropTypes.number,
  emojis: PropTypes.arrayOf(PropTypes.string).isRequired,
  fadeOut: PropTypes.bool,
  marginTop: PropTypes.number,
  opacity: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  opacityThreshold: PropTypes.number,
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
  emojis: ['+1'],
  fadeOut: true,
  opacity: 1,
  range: [0, 80],
  scaleTo: 1,
  size: 30,
  wiggleFactor: 0.5,
};

export default FloatingEmojis;
