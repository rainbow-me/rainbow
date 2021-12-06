import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
import { interpolate, ScaleInAnimation } from '../../animations';
import { Icon } from '../../icons';
import { Centered } from '../../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const { cond, divide, greaterThan } = Animated;

const Container = styled(Centered)`
  ${position.size(31)};
  left: 15;
  position: absolute;
`;

export default function HoldToAuthorizeButtonIcon({ animatedValue }: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const animation = useMemoOne(() => {
    return cond(
      greaterThan(animatedValue, 0),
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<number> | undefined... Remove this comment to see the full error message
      interpolate(animatedValue, {
        extrapolate: Animated.Extrapolate.CLAMP,
        inputRange: [30, 100],
        outputRange: [5, 0],
      }),
      divide(1, animatedValue)
    );
  }, [animatedValue]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ScaleInAnimation scaleTo={0.001} value={animation}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Icon
          color={colors.whiteLabel}
          name="progress"
          progress={animatedValue}
        />
      </ScaleInAnimation>
    </Container>
  );
}
