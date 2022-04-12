import useCountdown from '@bradgarropy/use-countdown';
import React, { useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Defs, G, RadialGradient, Stop, Svg } from 'react-native-svg';
import { CheckmarkAnimation } from '../animations/CheckmarkAnimation';
import { Text } from '../text';
import { SeparatorDots } from './SeparatorDots';
import { useVariableFont } from './useVariableFont';
import { Box } from '@rainbow-me/design-system';
import styled from '@rainbow-me/styled-components';

type LargeCountdownClockProps = {
  minutes?: number;
  seconds: number;
  onFinished: () => void;
};

const PROGRESS_RADIUS = 60;
const PROGRESS_STROKE_WIDTH = 8;
const PROGRESS_CENTER_COORDINATE = PROGRESS_RADIUS + PROGRESS_STROKE_WIDTH / 2;
const PROGRESS_STROKE_FULL_LENGTH = Math.round(2 * Math.PI * PROGRESS_RADIUS);

export default function LargeCountdownClock({
  minutes,
  seconds,
  onFinished,
}: LargeCountdownClockProps) {
  const [completed, setCompleted] = useState(false);
  const countdown = useCountdown({
    format: 'm:ss',
    minutes,
    onCompleted: () => {
      setCompleted(true);
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      setTimeout(() => {
        onFinished();
      }, 1500);
    },
    seconds,
  });
  const {
    displayMinutes,
    displaySeconds,
    fontSize,
    minuteEndsWithOne,
    lineHeight,
    separatorSize,
  } = useVariableFont(countdown.minutes, countdown.seconds);

  // convert clock time to seconds
  const totalSeconds = minutes ? minutes * 60 + seconds : seconds;
  // convert remaining clock time to seconds
  const timeRemaining = countdown.minutes * 60 + countdown.seconds;
  // save full stroke value to use in animation
  const offset = useSharedValue(PROGRESS_STROKE_FULL_LENGTH);
  // calculate stroke value based on remaining time
  offset.value =
    PROGRESS_STROKE_FULL_LENGTH -
    (timeRemaining / totalSeconds) * PROGRESS_STROKE_FULL_LENGTH;

  const animatedStroke = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(offset.value, {
      duration: 1000,
      easing: Easing.linear,
    }),
  }));

  const entering = () => {
    'worklet';
    const animations = {
      opacity: withTiming(1, { duration: 350 }),
      transform: [
        {
          scale: withSpring(1, {
            damping: 12,
            restDisplacementThreshold: 0.001,
            restSpeedThreshold: 0.001,
            stiffness: 260,
          }),
        },
      ],
    };
    const initialValues = {
      opacity: 0,
      transform: [{ scale: 0.5 }],
    };
    return {
      animations,
      initialValues,
    };
  };

  const clockExiting = () => {
    'worklet';
    const animations = {
      opacity: withTiming(0, { duration: 150 }),
      transform: [
        {
          scale: withTiming(2, { duration: 200 }),
        },
      ],
    };
    const initialValues = {
      opacity: 1,
      transform: [{ scale: 1 }],
    };
    return {
      animations,
      initialValues,
    };
  };

  const minutesExiting = () => {
    'worklet';
    const animations = {
      opacity: withTiming(0, { duration: 150 }),
      transform: [
        {
          scale: withTiming(0.5, { duration: 150 }),
        },
      ],
    };
    const initialValues = {
      opacity: 1,
      transform: [{ scale: 1 }],
    };
    return {
      animations,
      initialValues,
    };
  };

  return (
    <Box
      alignItems="center"
      as={Animated.View}
      entering={entering}
      height={{ custom: 132 }}
      justifyContent="center"
      width="full"
    >
      {completed ? (
        <CheckmarkAnimation />
      ) : (
        <Box
          alignItems="center"
          as={Animated.View}
          exiting={clockExiting}
          height={{ custom: 132 }}
          justifyContent="center"
          style={{
            position: 'absolute',
          }}
          width={{ custom: 132 }}
        >
          {displayMinutes ? (
            <Box
              alignItems="center"
              as={Animated.View}
              exiting={minutesExiting}
              flexDirection="row"
              justifyContent="center"
              key="withMinutes"
              style={{
                paddingRight: displayMinutes === 1 ? 3 : 0,
                position: 'absolute',
              }}
            >
              <ClockMinutes
                allowFontScaling={false}
                lineHeight={lineHeight}
                size={fontSize}
              >
                {displayMinutes}
              </ClockMinutes>
              <SeparatorDots
                minuteEndsWithOne={minuteEndsWithOne}
                size={separatorSize}
              />
              <ClockSeconds
                allowFontScaling={false}
                lineHeight={lineHeight}
                size={fontSize}
              >
                {displaySeconds}
              </ClockSeconds>
            </Box>
          ) : (
            <Box
              alignItems="center"
              as={Animated.View}
              entering={entering}
              flexDirection="row"
              justifyContent="center"
              key="onlySeconds"
              style={{
                paddingRight:
                  displaySeconds >= 10 && displaySeconds < 20 ? 3 : 0,
                position: 'absolute',
              }}
            >
              <ClockSeconds allowFontScaling={false} lineHeight={57} size={50}>
                {displaySeconds}
              </ClockSeconds>
            </Box>
          )}
          <Svg height="132" viewBox="0 0 130 130" width="132">
            <Defs>
              <RadialGradient
                cx="50%"
                cy="50%"
                fx="50%"
                fy="50%"
                id="large-countdown-clock-fill"
                r="50%"
              >
                <Stop offset="0%" stopColor="#9875D7" stopOpacity="0" />
                <Stop offset="100%" stopColor="#9875D7" stopOpacity="0.06" />
              </RadialGradient>
            </Defs>
            <G>
              <Circle
                cx={PROGRESS_CENTER_COORDINATE}
                cy={PROGRESS_CENTER_COORDINATE}
                fill="url(#large-countdown-clock-fill)"
                id="large-countdown-clock-center-face"
                r="51"
              />
              <AnimatedCircle
                animatedProps={animatedStroke}
                cx={PROGRESS_CENTER_COORDINATE}
                cy={PROGRESS_CENTER_COORDINATE}
                id="large-countdown-clock-progress-bar"
                r={PROGRESS_RADIUS}
                stroke="#9875D7"
                strokeDasharray={PROGRESS_STROKE_FULL_LENGTH}
                strokeDashoffset={0}
                strokeLinecap="round"
                strokeWidth={PROGRESS_STROKE_WIDTH}
                transform={`rotate(-90 ${PROGRESS_CENTER_COORDINATE} ${PROGRESS_CENTER_COORDINATE})`}
              />
            </G>
          </Svg>
        </Box>
      )}
    </Box>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedClockDisplay = Animated.createAnimatedComponent(Text);
const clockFontStyles = {
  align: 'center',
  color: '#9875D7',
  weight: 'heavy',
};

const ClockMinutes = styled(AnimatedClockDisplay).attrs(clockFontStyles)({
  fontVariant: ['tabular-nums'],
});

const ClockSeconds = styled(AnimatedClockDisplay).attrs(clockFontStyles)({
  fontVariant: ['tabular-nums'],
});
