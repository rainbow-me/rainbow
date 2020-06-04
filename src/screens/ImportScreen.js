import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/native';
import { useMemoOne } from 'use-memo-one';

import GreyNeonRainbow from '../assets/rainbows/greyneon.png';
import LightRainbow from '../assets/rainbows/light.png';
import LiquidRainbow from '../assets/rainbows/liquid.png';
import NeonRainbow from '../assets/rainbows/neon.png';
import PixelRainbow from '../assets/rainbows/pixel.png';

import TouchableBackdrop from '../components/TouchableBackdrop';
import Button from '../components/buttons/Button';
import { Centered, Page } from '../components/layout';
import { colors, position } from '../styles';

const Container = styled.View`
  ${StyleSheet.absoluteFillObject};
  background-color: white;
  justify-content: center
  align-items: center
`;

const INITIAL_SIZE = 200;

export const useAnimatedValue = initialValue => {
  const value = useRef();

  if (!value.current) {
    value.current = new Animated.Value(initialValue);
  }

  return value;
};

const rainbows = [
  {
    rotate: '150deg',
    scale: 0.9,
    source: GreyNeonRainbow,
    x: -100,
    y: -150,
  },
  {
    initialRotate: '-50deg',
    rotate: '0deg',
    scale: 0.8,
    source: NeonRainbow,
    x: 160,
    y: 300,
  },
  {
    rotate: '360deg',
    scale: 1.1,
    source: PixelRainbow,
    x: 160,
    y: -200,
  },
  {
    initialRotate: '300deg',
    rotate: '330deg',
    scale: 0.6,
    source: LightRainbow,
    x: -160,
    y: 200,
  },
  { rotate: '75deg', scale: 0.8, source: LiquidRainbow, x: 40, y: 200 },
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

export default function ImportScreen() {
  const [visible, setVisible] = useState();
  const animatedValue = useAnimatedValue(0);
  const traversedRainbows = useMemoOne(
    () => traverseRainbows(animatedValue.current),
    [animatedValue]
  );
  useEffect(() => {
    if (!visible) {
      return;
    }
    Animated.spring(animatedValue.current, {
      toValue: 1,
      useNativeDriver: true,
      damping: 5,
    }).start();
  }, [animatedValue, visible]);

  return (
    <Container>
      {visible &&
        traversedRainbows.map(({ source, style }, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <RainbowImage source={source} style={style} key={`rainbow${index}`} />
        ))}

      <TouchableOpacity
        onPress={() => setVisible(!visible)}
        style={{ position: 'absolute', top: 100 }}
      >
        <Text>rainow</Text>
      </TouchableOpacity>
    </Container>
  );
}
