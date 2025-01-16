import React, { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import { Animated, View, ViewProps } from 'react-native';
import FloatingEmoji from './FloatingEmoji';
import GravityEmoji from './GravityEmoji';
import { useTimeout } from '@/hooks';
import { position } from '@/styles';

interface Emoji {
  emojiToRender: string;
  x: number;
  y: number;
}

interface FloatingEmojisProps extends Omit<ViewProps, 'children'> {
  centerVertically?: boolean;
  children?: ReactNode | ((props: { onNewEmoji: (x?: number, y?: number) => void }) => ReactNode);
  disableHorizontalMovement?: boolean;
  disableRainbow?: boolean;
  disableVerticalMovement?: boolean;
  distance?: number;
  duration?: number;
  emojis: string[];
  fadeOut?: boolean;
  gravityEnabled?: boolean;
  marginTop?: number;
  opacity?: number | Animated.AnimatedInterpolation<number>;
  opacityThreshold?: number;
  range?: [number, number];
  scaleTo?: number;
  setOnNewEmoji?: (fn: ((x?: number, y?: number) => void) | undefined) => void;
  size: number;
  wiggleFactor?: number;
}

const EMPTY_ARRAY: Emoji[] = [];
const getEmoji = (emojis: string[]) => Math.floor(Math.random() * emojis.length);
const getRandomNumber = (min: number, max: number) => Math.random() * (max - min) + min;

const FloatingEmojis: React.FC<FloatingEmojisProps> = ({
  centerVertically,
  children,
  disableHorizontalMovement,
  disableRainbow,
  disableVerticalMovement,
  distance = 130,
  duration = 2000,
  emojis,
  fadeOut = true,
  gravityEnabled,
  marginTop,
  opacity = 1,
  opacityThreshold,
  range: [rangeMin, rangeMax] = [0, 80],
  scaleTo = 1,
  setOnNewEmoji,
  size = 30,
  wiggleFactor = 0.5,
  style,
  ...props
}) => {
  const emojisArray = useMemo(() => (Array.isArray(emojis) ? emojis : [emojis]), [emojis]);
  const [floatingEmojis, setEmojis] = useState<Emoji[]>(EMPTY_ARRAY);
  const [startTimeout, stopTimeout] = useTimeout();
  const clearEmojis = useCallback(() => setEmojis(EMPTY_ARRAY), []);

  // 🚧️ TODO: 🚧️
  // Clear emojis if page navigatorPosition falls below 0.93 (which we should call like `pageTransitionThreshold` or something)
  // otherwise, the FloatingEmojis look weird during stack transitions

  const onNewEmoji = useCallback(
    (x?: number, y?: number) => {
      // Set timeout to automatically clearEmojis after the latest one has finished animating
      stopTimeout();
      startTimeout(clearEmojis, duration * 1.1);

      setEmojis(existingEmojis => {
        const newEmoji = {
          emojiToRender:
            (existingEmojis.length + 1) % 7 === 0 && !disableRainbow
              ? 'rainbow'
              : emojisArray.length === 1
                ? emojisArray[0]
                : emojisArray[getEmoji(emojisArray)],
          x: x !== undefined ? x - getRandomNumber(-20, 20) : getRandomNumber(rangeMin, rangeMax),
          y: y || 0,
        };
        return [...existingEmojis, newEmoji];
      });
    },
    [clearEmojis, disableRainbow, duration, emojisArray, rangeMin, rangeMax, startTimeout, stopTimeout]
  );

  useEffect(() => {
    setOnNewEmoji?.(onNewEmoji);
    return () => setOnNewEmoji?.(undefined);
  }, [setOnNewEmoji, onNewEmoji]);

  return (
    <View style={[{ zIndex: 1 }, style]} {...props}>
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
                left={typeof size === 'number' ? x - size / 2 : x - Number(size) / 2}
                size={`${size}`}
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
                size={`${size}`}
                top={y}
                wiggleFactor={wiggleFactor}
              />
            ))}
      </Animated.View>
    </View>
  );
};

export default FloatingEmojis;
