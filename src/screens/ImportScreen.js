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
  interpolate,
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
  border-radius: 30;
  height: 60;
  left: -3;
  opacity: 0.2;
  position: absolute;
  top: -3;
  width: 236;
`;

const Shadow = styled(Reanimated.View)`
  ${shadow.build(0, 5, 15, colors.dark, 0.4)};
  border-radius: 30;
  height: 60;
  left: -3;
  position: absolute;
  top: -3;
  width: 236;
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
      <DarkShadow style={darkShadowStyle} />
      <Shadow style={shadowStyle} />
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
    delay: 0,
    id: 'grey',
    rotate: '150deg',
    scale: 0.5066666667,
    source: { uri: 'greyneon' },
    x: -116,
    y: -202,
  },
  {
    delay: 20,
    id: 'neon',
    rotate: '394.75deg',
    scale: 0.3333333333,
    source: { uri: 'neon' },
    x: 149,
    y: 380,
  },
  {
    delay: 40,
    id: 'pixel',
    rotate: '360deg',
    scale: 0.6666666667,
    source: { uri: 'pixel' },
    x: 173,
    y: -263,
  },
  {
    delay: 60,
    id: 'light',
    rotate: '-33deg',
    scale: 0.2826666667,
    source: { uri: 'light' },
    x: -172,
    y: 180,
  },
  {
    delay: 80,
    id: 'liquid',
    rotate: '75deg',
    scale: 0.42248,
    source: { uri: 'liquid' },
    x: 40,
    y: 215,
  },
];

const traversedRainbows = rainbows.map(
  ({
    delay,
    initialRotate = '0deg',
    rotate = '0deg',
    scale = 1,
    source,
    x = 0,
    y = 0,
  }) => {
    const animatedValue = new Animated.Value(0);
    return {
      delay,
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
      value: animatedValue,
    };
  }
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
      set(config.toValue, 5),
      startClock(clock),
    ]),
    timing(clock, state, config),
    state.position,
  ]);
}

const colorsHSL = [
  { h: 40, l: 0.5, s: 1 },
  { h: 150, l: 0.44, s: 1 },
  { h: 195, l: 0.43, s: 1 },
  { h: 248, l: 0.68, s: 1 },
  { h: 360, l: 0.64, s: 1 },
];

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

const springConfig = {
  bounciness: 7.30332,
  speed: 0.6021408,
  toValue: 1,
  useNativeDriver: true,
};

function colorAnimation(rValue, fromShadow) {
  const animation = runTiming(rValue.current);
  const h = interpolate(animation, {
    inputRange: [0, 1, 2, 3, 4, 5],
    outputRange: [
      ...colorsHSL.map(({ h }) => h),
      colorsHSL[colorsHSL.length - 1].h,
    ],
  });

  const s = interpolate(animation, {
    inputRange: [0, 1, 2, 3, 4, 5],
    outputRange: [
      ...colorsHSL.map(({ s }) => s),
      colorsHSL[colorsHSL.length - 1].s,
    ],
  });

  const l = interpolate(animation, {
    inputRange: [0, 1, 2, 3, 4, 5],
    outputRange: [
      ...colorsHSL.map(({ l }) => l),
      colorsHSL[colorsHSL.length - 1].l,
    ],
  });
  return colorHSV(h, s, l, fromShadow);
}

export default function ImportScreen() {
  const [visible, setVisible] = useState(false);
  const contentAnimation = useAnimatedValue(0);
  const importButtonAnimation = useAnimatedValue(1);

  useEffect(() => {
    if (!visible) {
      return;
    }

    Animated.parallel([
      ...traversedRainbows.map(({ value, delay = 0 }) =>
        Animated.spring(value, { ...springConfig, delay })
      ),
      Animated.spring(contentAnimation.current, springConfig),
      Animated.loop(
        Animated.sequence([
          Animated.timing(importButtonAnimation.current, {
            duration: 1000,
            toValue: 1.02,
            useNativeDriver: true,
          }),
          Animated.timing(importButtonAnimation.current, {
            duration: 1000,
            toValue: 0.98,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
    return () => {
      importButtonAnimation.current.setValue(1);
      contentAnimation.current.setValue(0);
    };
  }, [contentAnimation, importButtonAnimation, visible]);

  const buttonStyle = useMemoOne(
    () => ({
      transform: [{ scale: importButtonAnimation.current }],
      zIndex: 10,
    }),
    [importButtonAnimation]
  );

  const contentStyle = useMemoOne(
    () => ({
      transform: [
        {
          scale: contentAnimation.current.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.2],
          }),
        },
      ],
    }),
    [importButtonAnimation]
  );

  const rValue = useReanimatedValue(0);

  const backgroundColor = useMemoOne(() => colorAnimation(rValue, false), []);

  const importButtonProps = useMemoOne(() => {
    const color = colorAnimation(rValue, true);
    return {
      emoji: 'european_castle',
      height: 54,
      shadowStyle: {
        backgroundColor: backgroundColor,
        shadowColor: color,
      },
      style: {
        backgroundColor: colors.dark,
        borderColor: backgroundColor,
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
          <RainbowButton {...existingWalletButtonProps} />
        </ButtonWrapper>
      </ContentWrapper>
    </Container>
  );
}
