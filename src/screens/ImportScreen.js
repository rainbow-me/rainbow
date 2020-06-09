import MaskedView from '@react-native-community/masked-view';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import Reanimated, {
  Clock,
  Easing,
  Value as RValue,
  timing,
} from 'react-native-reanimated';
import styled from 'styled-components/native';
import { useMemoOne } from 'use-memo-one';
import { ButtonPressAnimation } from '../components/animations';
import RainbowText from '../components/icons/svg/RainbowText';
import { RowWithMargins } from '../components/layout';
import { Emoji, Text } from '../components/text';
import { colors, shadow } from '../styles';

const {
  add,
  and,
  block,
  clockRunning,
  color,
  not,
  set,
  cond,
  multiply,
  lessThan,
  abs,
  modulo,
  round,
  divide,
  sub,
  startClock,
} = Reanimated;

const ButtonContainer = styled(Reanimated.View)`
  border-radius: ${({ height }) => height / 2};
`;

const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})`
  align-self: center;
  height: 100%;
  padding-bottom: 4;
`;

const ButtonLabel = styled(Text).attrs(
  ({ textColor: color = colors.dark }) => ({
    align: 'center',
    color,
    size: 'larger',
    weight: 'bold',
  })
)``;

const ButtonEmoji = styled(Emoji).attrs({
  align: 'center',
  size: 16.25,
})`
  padding-bottom: 1.5px;
`;

const DarkShadow = styled(Reanimated.View)`
  ${shadow.build(0, 10, 30, colors.dark, 1)};
  background-color: ${colors.white};
  border-radius: ${({ height }) => height / 2};
  height: ${({ height }) => height};
  opacity: 0.2;
  position: absolute;
`;

const Shadow = styled(Reanimated.View)`
  ${shadow.build(0, 5, 15, colors.dark, 0.4)};
  border-radius: ${({ height }) => height / 2};
  height: ${({ height }) => height};
  position: absolute;
`;

const RainbowButton = ({
  darkShadowStyle,
  emoji,
  height,
  onPress,
  shadowStyle,
  style,
  textColor,
  text,
}) => {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      <DarkShadow height={height} style={darkShadowStyle} />
      <Shadow height={height} style={shadowStyle} />
      <ButtonContainer height={height} style={style}>
        <ButtonContent>
          <ButtonEmoji name={emoji} />
          <ButtonLabel textColor={textColor}>{text}</ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

const Container = styled.View`
  ${StyleSheet.absoluteFillObject};
  align-items: center;
  background-color: ${colors.white};
  justify-content: center;
`;

const ContentWrapper = styled(Animated.View)`
  align-items: center;
  height: 192;
  justify-content: space-between;
  margin-bottom: 20;
  z-index: 10;
`;

const ButtonWrapper = styled(Animated.View)`
  width: 100%;
`;

const INITIAL_SIZE = 375;

export const useAnimatedValue = initialValue => {
  const value = useRef();

  if (!value.current) {
    value.current = new Animated.Value(initialValue);
  }

  return value;
};

export const useReanimatedValue = initialValue => {
  const value = useRef();

  if (!value.current) {
    value.current = new RValue(initialValue);
  }

  return value;
};

const rainbows = [
  {
    id: 'grey',
    rotate: '150deg',
    scale: 0.5066666667,
    source: { uri: 'greyneon' },
    x: -116,
    y: -202,
  },
  {
    id: 'neon',
    rotate: '394.75deg',
    scale: 0.3333333333,
    source: { uri: 'neon' },
    x: 149,
    y: 380,
  },
  {
    id: 'pixel',
    rotate: '360deg',
    scale: 0.6666666667,
    source: { uri: 'pixel' },
    x: 173,
    y: -263,
  },
  {
    id: 'light',
    rotate: '-33deg',
    scale: 0.2826666667,
    source: { uri: 'light' },
    x: -172,
    y: 180,
  },
  {
    id: 'liquid',
    rotate: '75deg',
    scale: 0.42248,
    source: { uri: 'liquid' },
    x: 40,
    y: 215,
  },
];

const traverseRainbows = animatedValue =>
  rainbows.map(
    ({
      initialRotate = '0deg',
      rotate = '0deg',
      scale = 1,
      source,
      x = 0,
      y = 0,
    }) => ({
      source,
      style: {
        opacity: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
        transform: [
          {
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, x],
            }),
          },
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, y],
            }),
          },
          {
            rotate: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [initialRotate, rotate],
            }),
          },
          {
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, scale],
            }),
          },
        ],
      },
    })
  );

const RainbowImage = styled(Animated.Image)`
  height: ${INITIAL_SIZE};
  position: absolute;
  width: ${INITIAL_SIZE};
`;

const RAINBOW_TEXT_HEIGHT = 32;
const RAINBOW_TEXT_WIDTH = 125;

const RainbowTextMask = styled(Reanimated.View)`
  height: ${RAINBOW_TEXT_HEIGHT};
  width: ${RAINBOW_TEXT_WIDTH};
`;

function match(condsAndResPairs, offset = 0) {
  if (condsAndResPairs.length - offset === 1) {
    return condsAndResPairs[offset];
  } else if (condsAndResPairs.length - offset === 0) {
    return undefined;
  }
  return cond(
    condsAndResPairs[offset],
    condsAndResPairs[offset + 1],
    match(condsAndResPairs, offset + 2)
  );
}

function runTiming(value) {
  const clock = new Clock();
  const state = {
    finished: new RValue(0),
    frameTime: new RValue(0),
    position: new RValue(0),
    time: new RValue(0),
  };

  const config = {
    duration: 2500,
    easing: Easing.linear,
    toValue: new RValue(1),
  };

  return block([
    cond(and(not(state.finished), clockRunning(clock)), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.frameTime, 0),
      set(config.toValue, 360),
      startClock(clock),
    ]),
    timing(clock, state, config),
    state.position,
  ]);
}

function colorHSV(h, s, v, fromShadow) {
  const c = multiply(v, s);
  const hh = divide(h, 60);
  const x = multiply(c, sub(1, abs(sub(modulo(hh, 2), 1))));

  const m = sub(v, c);

  const colorRGB = (r, g, b) =>
    // from some reason there's a different bit shifting with shadows
    fromShadow
      ? color(
          round(multiply(255, add(g, m))),
          round(multiply(255, add(b, m))),
          255,
          divide(round(multiply(256, add(r, m))), 256)
        )
      : color(
          round(multiply(255, add(r, m))),
          round(multiply(255, add(g, m))),
          round(multiply(255, add(b, m)))
        );

  return match([
    lessThan(h, 60),
    colorRGB(c, x, 0),
    lessThan(h, 120),
    colorRGB(x, c, 0),
    lessThan(h, 180),
    colorRGB(0, c, x),
    lessThan(h, 240),
    colorRGB(0, x, c),
    lessThan(h, 300),
    colorRGB(x, 0, c),
    colorRGB(c, 0, x),
  ]);
}

export default function ImportScreen() {
  const [visible, setVisible] = useState(false);
  const animatedValue = useAnimatedValue(0);
  const contentAnimation = useAnimatedValue(1);

  const traversedRainbows = useMemoOne(
    () => traverseRainbows(animatedValue.current),
    [animatedValue]
  );
  useEffect(() => {
    if (!visible) {
      return;
    }

    Animated.sequence([
      Animated.spring(animatedValue.current, {
        bounciness: 7.30332,
        speed: 0.6021408,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(contentAnimation.current, {
            duration: 1000,
            toValue: 1.02,
            useNativeDriver: true,
          }),
          Animated.timing(contentAnimation.current, {
            duration: 1000,
            toValue: 0.98,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
    return () => {
      contentAnimation.current.setValue(1);
      animatedValue.current.setValue(0);
    };
  }, [animatedValue, visible]);

  const buttonStyle = useMemoOne(
    () => ({ transform: [{ scale: contentAnimation.current }], zIndex: 10 }),
    [contentAnimation]
  );

  const rValue = useReanimatedValue(0);

  const backgroundColor = useMemoOne(
    () => colorHSV(runTiming(rValue.current), 1, 1, false),
    []
  );

  const importButtonProps = useMemoOne(() => {
    const color = colorHSV(runTiming(rValue.current), 1, 1, true);
    return {
      emoji: 'european_castle',
      height: 54,
      shadowStyle: {
        backgroundColor: backgroundColor,
        borderRadius: 30,
        height: 60,
        left: -3,
        shadowColor: color,
        top: -3,
        width: 236,
      },
      style: {
        backgroundColor: colors.dark,
        borderColor: backgroundColor,
        borderWidth: 0,
        width: 230,
      },
      text: 'Get a new wallet',
      textColor: colors.white,
    };
  }, [rValue]);

  const existingWalletButtonProps = useMemoOne(() => {
    return {
      darkShadowStyle: {
        opacity: 0,
      },
      emoji: 'old_key',
      height: 56,
      shadowStyle: {
        opacity: 0,
      },
      style: {
        backgroundColor: colors.blueGreyDarkLight,
        width: 248,
      },
      text: 'I already have one',
      textColor: colors.alpha(colors.blueGreyDark, 0.8),
    };
  }, [rValue]);

  const textStyle = useMemoOne(() => {
    return {
      backgroundColor,
    };
  }, [rValue]);

  return (
    <Container>
      {visible &&
        traversedRainbows.map(({ source, style, id }) => (
          <RainbowImage source={source} style={style} key={`rainbow${id}`} />
        ))}

      <ContentWrapper>
        <TouchableOpacity onPress={() => setVisible(!visible)}>
          <MaskedView maskElement={<RainbowText />}>
            <RainbowTextMask style={textStyle} />
          </MaskedView>
        </TouchableOpacity>

        <ButtonWrapper style={buttonStyle}>
          <RainbowButton {...importButtonProps} />
        </ButtonWrapper>
        <ButtonWrapper>
          <RainbowButton {...existingWalletButtonProps} />
        </ButtonWrapper>
      </ContentWrapper>
    </Container>
  );
}
