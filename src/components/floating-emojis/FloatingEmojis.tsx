import { castArray } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, View } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingEmoji' was resolved to '/Users/n... Remove this comment to see the full error message
import FloatingEmoji from './FloatingEmoji';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useTimeout } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const EMPTY_ARRAY: any = [];
const getEmoji = (emojis: any) => Math.floor(Math.random() * emojis.length);
const getRandomNumber = (min: any, max: any) =>
  Math.random() * (max - min) + min;

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
  setOnNewEmoji,
  size,
  wiggleFactor,
  ...props
}: any) => {
  const emojisArray = useMemo(() => castArray(emojis), [emojis]);
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

      // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'existingEmojis' implicitly has an 'any'... Remove this comment to see the full error message
      setEmojis(existingEmojis => {
        const newEmoji = {
          // if a user has smashed the button 7 times, they deserve a 🌈 rainbow
          emojiToRender:
            (existingEmojis.length + 1) % 7 === 0 && !disableRainbow
              ? 'rainbow'
              : emojisArray.length === 1
              ? emojisArray[0]
              : emojisArray[getEmoji(emojisArray)],
          // @ts-expect-error ts-migrate(2556) FIXME: Expected 2 arguments, but got 0 or more.
          x: x ? x - getRandomNumber(-20, 20) : getRandomNumber(...range) + '%',
          y: y || 0,
        };
        return [...existingEmojis, newEmoji];
      });
    },
    [
      clearEmojis,
      disableRainbow,
      duration,
      emojisArray,
      range,
      startTimeout,
      stopTimeout,
    ]
  );

  useEffect(() => {
    setOnNewEmoji?.(onNewEmoji);
    return () => setOnNewEmoji?.(undefined);
  }, [setOnNewEmoji, onNewEmoji]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View zIndex={1} {...props}>
      {typeof children === 'function' ? children({ onNewEmoji }) : children}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View
        pointerEvents="none"
        style={{
          opacity,
          ...position.coverAsObject,
        }}
      >
        // @ts-expect-error ts-migrate(7031) FIXME: Binding element
        'emojiToRender' implicitly has an ... Remove this comment to see the
        full error message
        {floatingEmojis.map(({ emojiToRender, x, y }, index) => (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
