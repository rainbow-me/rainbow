import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, View } from 'react-native';
import FloatingEmoji from './FloatingEmoji';
import GravityEmoji from './GravityEmoji';
import { useTimeout } from '@/hooks';
import { position } from '@/styles';

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
  gravityEnabled,
  marginTop,
  opacity,
  opacityThreshold,
  range,
  scaleTo,
  setOnNewEmoji,
  size,
  wiggleFactor,
  ...props
}) => {
  const emojisArray = useMemo(() => (Array.isArray(emojis) ? emojis : [emojis]), [emojis]);
  const [floatingEmojis, setEmojis] = useState(EMPTY_ARRAY);
  const [startTimeout, stopTimeout] = useTimeout();
  const clearEmojis = useCallback(() => setEmojis(EMPTY_ARRAY), []);

  // 🚧️ TODO: 🚧️
  // Clear emojis if page navigatorPosition falls below 0.93 (which we should call like `pageTransitionThreshold` or something)
  // otherwise, the FloatingEmojis look weird during stack transitions

  const onNewEmoji = useCallback(
    (x, y) => {
      // Set timeout to automatically clearEmojis after the latest one has finished animating
      stopTimeout();
      startTimeout(clearEmojis, duration * 1.1);

      setEmojis(existingEmojis => {
        const newEmoji = {
          // if a user has smashed the button 7 times, they deserve a 🌈 rainbow
          emojiToRender:
            (existingEmojis.length + 1) % 7 === 0 && !disableRainbow
              ? 'rainbow'
              : emojisArray.length === 1
                ? emojisArray[0]
                : emojisArray[getEmoji(emojisArray)],
          x: x ? x - getRandomNumber(-20, 20) : getRandomNumber(...range),
          y: y || 0,
        };
        return [...existingEmojis, newEmoji];
      });
    },
    [clearEmojis, disableRainbow, duration, emojisArray, range, startTimeout, stopTimeout]
  );

  useEffect(() => {
    setOnNewEmoji?.(onNewEmoji);
    return () => setOnNewEmoji?.(undefined);
  }, [setOnNewEmoji, onNewEmoji]);

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
        {gravityEnabled
          ? floatingEmojis.map(({ emojiToRender, x, y }, index) => (
              <GravityEmoji
                key={`${x}${y}`}
                distance={Math.ceil(distance)}
                duration={duration}
                emoji={emojiToRender}
                index={index}
                left={x - size / 2}
                size={size}
                top={y}
              />
            ))
          : floatingEmojis.map(({ emojiToRender, x, y }, index) => (
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
  gravityEnabled: PropTypes.bool,
  marginTop: PropTypes.number,
  opacity: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  opacityThreshold: PropTypes.number,
  range: PropTypes.arrayOf(PropTypes.number),
  scaleTo: PropTypes.number,
  setOnNewEmoji: PropTypes.func,
  size: PropTypes.string.isRequired,
  wiggleFactor: PropTypes.number,
};

FloatingEmojis.defaultProps = {
  distance: 130,
  duration: 2000,
  // Defaults the emoji to 👍️ (thumbs up).
  // To view complete list of emojis compatible with this component,
  // head to https://github.com/muan/unicode-emoji-json/blob/master/data-by-emoji.json
  emojis: ['thumbs_up'],
  fadeOut: true,
  opacity: 1,
  range: [0, 80],
  scaleTo: 1,
  size: 30,
  wiggleFactor: 0.5,
};

export default FloatingEmojis;
