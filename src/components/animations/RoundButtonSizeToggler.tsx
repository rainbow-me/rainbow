import React from 'react';
import Animated, { SpringUtils } from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash/src/v1';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { Row } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

const { add, divide, multiply, sub } = Animated;

export const RoundButtonCapSize = 30;

const AnimatedCenter = styled(Animated.View)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type '{ hitSlop... Remove this comment to see the full error message
  background-color: ${({ color }) => color};
  height: ${RoundButtonCapSize};
  width: 100;
`;

const Cap = styled(Animated.View)`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'capDirection' does not exist on type '{ ... Remove this comment to see the full error message
  ${({ capDirection }) =>
    borders.buildRadius(capDirection, RoundButtonCapSize / 2)};
  ${position.size(RoundButtonCapSize)};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type '{ hitSlop... Remove this comment to see the full error message
  background-color: ${({ color }) => color};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Center = styled.View`
  transform: translateX(${RoundButtonCapSize * -2}px);
`;

const Container = styled(Row)`
  position: absolute;
`;

const RoundButtonSizeToggler = ({
  color,
  endingWidth,
  isOpen,
  isAbsolute,
  startingWidth,
}: any) => {
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

  const { colors } = useTheme();

  const colorToUse = color || colors.blueGreyDarkLight;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container isAbsolute={isAbsolute}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Cap capDirection="left" color={colorToUse} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Center>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AnimatedCenter color={colorToUse} style={centerStyle} />
      </Center>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Cap capDirection="right" color={colorToUse} style={rightCapStyle} />
    </Container>
  );
};

export default magicMemo(RoundButtonSizeToggler, [
  'endingWidth',
  'isOpen',
  'startingWidth',
  'isDarkMode',
]);
