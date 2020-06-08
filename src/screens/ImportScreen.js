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

import GreyNeonRainbow from '../assets/rainbows/greyneon.png';
import LightRainbow from '../assets/rainbows/light.png';
import LiquidRainbow from '../assets/rainbows/liquid.png';
import NeonRainbow from '../assets/rainbows/neon.png';
import PixelRainbow from '../assets/rainbows/pixel.png';
import { ButtonPressAnimation } from '../components/animations';
import RainbowText from '../components/icons/svg/RainbowText';
import { RowWithMargins } from '../components/layout';
import { Text } from '../components/text';
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

const ButtonContainer = styled(Reanimated.View).attrs({
  pointerEvents: 'none',
})`
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  border-radius: ${({ height }) => height / 2};
`;

const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: -2.5,
})`
  align-self: center;
  height: 100%;
  margin-right: ${({ type }) => (type === 'addCash' ? 9 : 0)};
  padding-bottom: 4;
`;

const ButtonLabel = styled(Text).attrs(
  ({ textColor: color = colors.black }) => ({
    align: 'center',
    color,
    letterSpacing: 'roundedMedium',
    size: 'larger',
    weight: 'bold',
  })
)``;

const Shadow = styled(Reanimated.View)`
  ${shadow.build(0, 10, 30, colors.dark, 1)};
  background-color: ${colors.white};
  border-radius: ${({ height }) => height / 2};
  height: ${({ height }) => height};
  opacity: 0.2;
  position: absolute;
  width: ${({ width }) => width};
`;

const RainbowButton = ({
  height = 56,
  onPress,
  shadowStyle,
  style,
  textColor,
  text,
}) => {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      <Shadow height={height} width="100%" style={shadowStyle} />
      <ButtonContainer height={height} width="100%" style={style}>
        <ButtonContent>
          <ButtonLabel textColor={textColor}>{text}</ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

const Container = styled.View`
  ${StyleSheet.absoluteFillObject};
  background-color: white;
  justify-content: center
  align-items: center
`;

const ContentWrapper = styled(Animated.View)`
  z-index: 10
  width: 100%;
  height: 180;
  padding-horizontal: 40
  align-items: center
  justify-content: space-between;
`;

const ButtonWrapper = styled(Animated.View)`
  width: 100%;
`;

const INITIAL_SIZE = 200;

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
    scale: 0.9,
    source: GreyNeonRainbow,
    x: -100,
    y: -150,
  },
  {
    id: 'neon',
    initialRotate: '-50deg',
    rotate: '0deg',
    scale: 0.8,
    source: NeonRainbow,
    x: 160,
    y: 300,
  },
  {
    id: 'pixel',
    rotate: '360deg',
    scale: 1.1,
    source: PixelRainbow,
    x: 160,
    y: -200,
  },
  {
    id: 'light',
    initialRotate: '300deg',
    rotate: '330deg',
    scale: 0.6,
    source: LightRainbow,
    x: -160,
    y: 200,
  },
  {
    id: 'liquid',
    rotate: '75deg',
    scale: 0.8,
    source: LiquidRainbow,
    x: 40,
    y: 200,
  },
];

const traverseRainbows = animatedValue =>
  rainbows.map(
    ({
      source,
      x = 0,
      y = 0,
      rotate = '0deg',
      initialRotate = '0deg',
      scale = 1,
    }) => ({
      source,
      style: {
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
  width: ${INITIAL_SIZE}
  height: ${INITIAL_SIZE}
  position: absolute
`;

const RAINBOW_TEXT_HEIGHT = 25;
const RAINBOW_TEXT_WIDTH = 125;

const RainbowTextMask = styled(Reanimated.View)`
  height: ${RAINBOW_TEXT_HEIGHT}
  width: ${RAINBOW_TEXT_WIDTH}
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
    duration: 5000,
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
  const contentAnimattion = useAnimatedValue(1);

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
        damping: 5,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(contentAnimattion.current, {
            duration: 1000,
            toValue: 0.95,
            useNativeDriver: true,
          }),
          Animated.timing(contentAnimattion.current, {
            duration: 1000,
            toValue: 1,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
    return () => {
      contentAnimattion.current.setValue(1);
      animatedValue.current.setValue(0);
    };
  }, [animatedValue, visible]);

  const buttonStyle = useMemoOne(
    () => ({ transform: [{ scale: contentAnimattion.current }] }),
    [contentAnimattion]
  );

  const contentStyle = useMemoOne(
    () => ({
      transform: [
        {
          scale: animatedValue.current.interpolate({
            inputRange: [0, 2],
            outputRange: [0.8, 1.3],
          }),
        },
      ],
    }),
    [contentAnimattion]
  );

  const rValue = useReanimatedValue(0);

  const backgroundColor = useMemoOne(
    () => colorHSV(runTiming(rValue.current), 1, 1, false),
    []
  );

  const importButtonProps = useMemoOne(() => {
    const color = colorHSV(runTiming(rValue.current), 1, 1, true);
    return {
      shadowStyle: {
        shadowColor: color,
      },
      style: {
        backgroundColor: colors.black,
        borderColor: backgroundColor,
        borderWidth: 3,
      },
      text: '💎 Get a New Wallet',
      textColor: colors.white,
    };
  }, [rValue]);

  const existingWallerButtonProps = useMemoOne(() => {
    return {
      shadowStyle: {
        opacity: 0,
      },
      style: {
        backgroundColor: colors.lighterGrey,
      },
      text: '🗝️ Import My Walllet',
      textColor: colors.black,
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

      <ContentWrapper style={contentStyle}>
        <TouchableOpacity onPress={() => setVisible(!visible)}>
          <MaskedView maskElement={<RainbowText />}>
            <RainbowTextMask style={textStyle} />
          </MaskedView>
        </TouchableOpacity>

        <ButtonWrapper style={buttonStyle}>
          <RainbowButton {...importButtonProps} />
        </ButtonWrapper>
        <ButtonWrapper>
          <RainbowButton {...existingWallerButtonProps} />
        </ButtonWrapper>
      </ContentWrapper>
    </Container>
  );
}
