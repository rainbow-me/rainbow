import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Flex } from '../layout';
import styled from '@rainbow-me/styled-components';

const Dots = styled(Animated.createAnimatedComponent(Flex))(
  ({ minuteEndsWithOne }) => ({
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: minuteEndsWithOne ? -1 : 2,
    marginRight: 3,
    paddingBottom: 2,
  })
);

const SingleDot = styled(View)(({ size }) => ({
  backgroundColor: '#9875D7',
  borderRadius: 100,
  height: size,
  marginBottom: size / 2,
  marginTop: size / 2,
  width: size,
}));

export function SeparatorDots({ size, minuteEndsWithOne }) {
  return (
    <Dots minuteEndsWithOne={minuteEndsWithOne}>
      <SingleDot size={size} />
      <SingleDot size={size} />
    </Dots>
  );
}
