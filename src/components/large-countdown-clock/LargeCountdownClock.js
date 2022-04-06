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
import CheckmarkAnimation from '../animations/CheckmarkAnimation';
import { Flex } from '../layout';
import { Text } from '../text';
import { SeparatorDots } from './SeparatorDots';
import { useVariableFont } from './useVariableFont';
import styled from '@rainbow-me/styled-components';

const PROGRESS_RADIUS = 60;
const PROGRESS_STROKE_WIDTH = 8;
const PROGRESS_CENTER_COORDINATE = PROGRESS_RADIUS + PROGRESS_STROKE_WIDTH / 2;
const PROGRESS_STROKE_FULL_LENGTH = Math.round(2 * Math.PI * PROGRESS_RADIUS);

export default function LargeCountdownClock({ minutes, seconds, onFinished }) {
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
    size,
    minuteEndsWithOne,
    lineHeight,
    separatorSize,
  } = useVariableFont(countdown.minutes, countdown.seconds);

  // convert clock time to seconds
  const totalSeconds = minutes * 60 + seconds;
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
    <Scene entering={entering}>
      {completed ? (
        <CheckmarkAnimation />
      ) : (
        <CountdownContainer exiting={clockExiting}>
          {displayMinutes ? (
            <Clock
              exiting={minutesExiting}
              key="withMinutes"
              uglyDigitOffset={displayMinutes === 1}
            >
              <ClockMinutes
                allowFontScaling={false}
                lineHeight={lineHeight}
                size={size}
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
                size={size}
              >
                {displaySeconds}
              </ClockSeconds>
            </Clock>
          ) : (
            <Clock
              entering={entering}
              key="onlySeconds"
              uglyDigitOffset={displaySeconds >= 10 && displaySeconds < 20}
            >
              <ClockSeconds allowFontScaling={false} lineHeight={57} size={50}>
                {displaySeconds}
              </ClockSeconds>
            </Clock>
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
        </CountdownContainer>
      )}
    </Scene>
  );
}

const Scene = styled(Animated.createAnimatedComponent(Flex))({
  alignItems: 'center',
  height: 132,
  justifyContent: 'center',
  marginBottom: 40,
  width: 132,
});

const CountdownContainer = styled(Animated.createAnimatedComponent(Flex))({
  alignItems: 'center',
  height: 132,
  justifyContent: 'center',
  position: 'absolute',
  width: 132,
});

const Clock = styled(Animated.createAnimatedComponent(Flex))(
  ({ uglyDigitOffset }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: uglyDigitOffset ? 3 : 0,
    position: 'absolute',
  })
);

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
