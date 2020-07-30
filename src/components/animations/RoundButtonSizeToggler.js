import React from 'react';
import Animated, { SpringUtils } from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { useMemoOne } from 'use-memo-one';
import { Row } from '../layout';
import { borders, colors, position } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const { add, divide, multiply, sub } = Animated;

export const RoundButtonCapSize = 30;

const AnimatedCenter = styled(Animated.View)`
  background-color: ${({ color }) => color};
  height: ${RoundButtonCapSize};
  width: 100;
`;

const Cap = styled(Animated.View)`
  ${({ capDirection }) =>
    borders.buildRadius(capDirection, RoundButtonCapSize / 2)};
  ${position.size(RoundButtonCapSize)};
  background-color: ${({ color }) => color};
`;

const Center = styled.View`
  transform: translateX(${RoundButtonCapSize * -2}px);
`;

const Container = styled(Row)`
  position: absolute;
`;

const RoundButtonSizeToggler = ({
  color = colors.blueGreyDarkLight,
  endingWidth,
  isOpen,
  isAbsolute,
  startingWidth,
}) => {
  const animation = useSpringTransition(
    bin(isOpen),
    SpringUtils.makeConfigFromOrigamiTensionAndFriction({
      ...SpringUtils.makeDefaultConfig(),
      friction: 20,
      tension: 200,
    })
  );

  const contentScaleX = useMemoOne(
    () =>
      add(
        multiply(animation, endingWidth / 100 - startingWidth / 100),
        startingWidth / 100
      ),
    [animation, endingWidth, startingWidth]
  );

  const centerStyle = useMemoOne(
    () => ({
      transform: [
        { scaleX: contentScaleX },
        { translateX: multiply(divide(sub(1, contentScaleX, 100), 2), -1) },
      ],
    }),
    [contentScaleX]
  );

  const rightCapStyle = useMemoOne(
    () => ({
      transform: [
        { translateX: sub(multiply(-100, sub(1, contentScaleX)), 11) },
      ],
    }),
    [contentScaleX]
  );

  return (
    <Container isAbsolute={isAbsolute}>
      <Cap capDirection="left" color={color} />
      <Center>
        <AnimatedCenter color={color} style={centerStyle} />
      </Center>
      <Cap capDirection="right" color={color} style={rightCapStyle} />
    </Container>
  );
};

export default magicMemo(RoundButtonSizeToggler, [
  'endingWidth',
  'isOpen',
  'startingWidth',
]);
