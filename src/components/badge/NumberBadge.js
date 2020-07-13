import React, { useState } from 'react';
import Animated, { SpringUtils } from 'react-native-reanimated';
import { useSpringTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { useTimeout } from '../../hooks';
import { magicMemo } from '../../utils';
import { interpolate } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { borders, colors, position } from '@rainbow-me/styles';

const Container = styled(Animated.View)`
  ${position.centered};
  height: ${({ size }) => size};
  position: absolute;
  right: ${({ offset }) => offset * -1};
  top: ${({ offset }) => offset * -1};
  z-index: 1;
`;

const Circle = styled(Centered)`
  ${({ offset, size, valueLength }) =>
    valueLength === 1
      ? `
        ${borders.buildCircle(size)};
        padding-left: 1;
      `
      : `
        padding-left: 5.5;
        padding-right: 5.5;
        transform: translateX(${Math.floor(offset / 2)}px);
      `}
  background-color: ${colors.appleBlue};
  border-radius: 15;
  padding-bottom: 3;
  padding-top: 2;
`;

const BadgeSpringConfig = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
  ...SpringUtils.makeDefaultConfig(),
  friction: 13,
  tension: 145,
});

const Badge = ({
  delay = 1500,
  isVisible,
  maxLength = 2,
  offset = 7,
  size = 19,
  value,
  ...props
}) => {
  const [delayedIsVisible, setDelayedIsVisible] = useState(isVisible);
  const [startDelayTimeout] = useTimeout();

  startDelayTimeout(() => setDelayedIsVisible(isVisible), delay);

  const animation = useSpringTransition(delayedIsVisible, BadgeSpringConfig);

  const translateY = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const valueLength = value.toString().length;

  return (
    <Container
      {...props}
      offset={offset}
      size={size}
      style={{ transform: [{ scale: animation, translateY }] }}
    >
      <Circle offset={offset} size={size} valueLength={valueLength}>
        <Text color="white" size="smaller" weight="semibold">
          {valueLength > maxLength ? `${'9'.repeat(maxLength)}+` : value}
        </Text>
      </Circle>
    </Container>
  );
};

export default magicMemo(Badge, ['isVisible', 'value']);
