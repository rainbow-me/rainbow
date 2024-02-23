import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HapticFeedbackType } from '@/utils/haptics';
import { Bleed } from '@/design-system';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { useAnimationContext } from '../contexts/AnimationContext';
import {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { generateRainbowColors, triggerHapticFeedback } from '../constants';
import { fonts } from '@/styles';

type AnimatedTextProps = {
  color?: { text: string; shadow: string };
  delayStart?: number;
  disableShadow?: boolean;
  enableHapticTyping?: boolean;
  hapticType?: HapticFeedbackType;
  multiline?: boolean;
  onComplete?: () => void;
  opacity?: number;
  rainbowText?: boolean;
  repeat?: boolean;
  shadowOpacity?: number;
  skipAnimation?: boolean;
  startWhenTrue?: boolean;
  textAlign?: 'center' | 'left' | 'right';
  textContent: string;
  typingSpeed?: number;
  weight?: 'bold' | 'normal';
} & ({ color: { text: string; shadow: string } } | { rainbowText: boolean });

export const AnimatedText = ({
  color,
  delayStart,
  disableShadow,
  enableHapticTyping,
  hapticType = 'selection',
  multiline,
  onComplete,
  opacity,
  rainbowText,
  repeat,
  shadowOpacity,
  skipAnimation,
  startWhenTrue,
  textAlign,
  textContent,
  typingSpeed = 20,
  weight = 'bold',
}: AnimatedTextProps) => {
  const { colors } = useTheme();
  const { currentSequenceIndex, getNextAnimationIndex, incrementSequence } = useAnimationContext();
  const index = useRef(getNextAnimationIndex()).current;

  const displayedCharacters = useSharedValue(skipAnimation ? textContent.length : 0);
  const [displayedText, setDisplayedText] = useState(skipAnimation ? textContent : '');

  const rainbowTextColors = useMemo(() => (rainbowText ? generateRainbowColors(textContent) : undefined), [rainbowText, textContent]);

  const getRainbowTextStyle = useCallback(
    (i: number) => ({
      color: rainbowTextColors?.[i]?.text,
      opacity,
      textAlign,
      textShadowColor: disableShadow
        ? 'transparent'
        : shadowOpacity && rainbowTextColors?.[i]?.shadow
          ? colors.alpha(rainbowTextColors?.[i]?.shadow, shadowOpacity)
          : rainbowTextColors?.[i]?.shadow,
    }),
    [colors, disableShadow, opacity, rainbowTextColors, shadowOpacity, textAlign]
  );

  const textStyle = useMemo(
    () => ({
      color: rainbowText ? undefined : color?.text,
      fontWeight: weight,
      opacity,
      textAlign,
      textShadowColor: disableShadow
        ? 'transparent'
        : rainbowText
          ? undefined
          : shadowOpacity && color?.shadow
            ? colors.alpha(color?.shadow, shadowOpacity)
            : color?.shadow,
    }),
    [color, colors, disableShadow, opacity, rainbowText, shadowOpacity, textAlign, weight]
  );

  const animationConfig = useMemo(
    () => ({
      duration: textContent.length * typingSpeed,
      easing: Easing.linear,
    }),
    [textContent, typingSpeed]
  );

  const onAnimationComplete = useCallback(
    (isFinished?: boolean) => {
      'worklet';
      if (isFinished) {
        if (onComplete) {
          runOnJS(onComplete)();
        }
        runOnJS(incrementSequence)();

        if (repeat) {
          displayedCharacters.value = withRepeat(
            withSequence(
              withTiming(textContent.length, { duration: typingSpeed }),
              withTiming(0, { duration: 0 }),
              withTiming(0, { duration: typingSpeed }),
              withTiming(textContent.length, animationConfig)
            ),
            -1,
            false
          );
        }
      }
    },
    [animationConfig, displayedCharacters, incrementSequence, onComplete, repeat, textContent.length, typingSpeed]
  );

  useAnimatedReaction(
    () => ({ displayedValue: displayedCharacters.value, repeat }),
    (current, previous) => {
      if (!previous?.displayedValue || Math.round(current.displayedValue) !== Math.round(previous?.displayedValue)) {
        const newText = textContent.slice(0, Math.round(current.displayedValue)) || ' ';

        if (current.repeat === false && newText === textContent) {
          runOnJS(setDisplayedText)(newText);
          cancelAnimation(displayedCharacters);
          displayedCharacters.value = textContent.length;
          return;
        }

        runOnJS(setDisplayedText)(newText);
        if (enableHapticTyping && Math.round(current.displayedValue) && newText[newText.length - 1] !== ' ') {
          runOnJS(triggerHapticFeedback)(hapticType);
        }
      }
    }
  );

  useEffect(() => {
    if (index !== undefined && currentSequenceIndex === index && (startWhenTrue === undefined || startWhenTrue)) {
      if (!skipAnimation) {
        const timer = setTimeout(() => {
          displayedCharacters.value = 0;
          displayedCharacters.value = withTiming(textContent.length, animationConfig, onAnimationComplete);
        }, delayStart || 0);

        return () => {
          clearTimeout(timer);
        };
      } else {
        onComplete?.();
        incrementSequence();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSequenceIndex, index, startWhenTrue, textContent]);

  return (
    <Bleed space="16px">
      <RNText style={[styles.text, textStyle, multiline ? { lineHeight: 20.25 } : {}]}>
        {rainbowText
          ? displayedText.split('').map((char, i) => (
              <RNText key={i} style={[!ios && styles.android, getRainbowTextStyle(i)]}>
                {char}
              </RNText>
            ))
          : displayedText}
      </RNText>
    </Bleed>
  );
};

const styles = StyleSheet.create({
  android: {
    fontFamily: fonts.family.SFMono,
    letterSpacing: 3.75,
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 11,
    overflow: 'visible',
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  text: {
    fontFamily: fonts.family.SFMono,
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 11,
    overflow: 'visible',
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
