import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
import { interpolate, ScaleInAnimation } from '../../animations';
import { Icon } from '../../icons';
import { Centered } from '../../layout';
import { position } from '@rainbow-me/styles';

const { cond, divide, greaterThan } = Animated;

const Container = styled(Centered)`
  ${position.size(31)};
  left: 15;
  position: absolute;
`;

export default function HoldToAuthorizeButtonIcon({ animatedValue }) {
  const { colors } = useTheme();

  const animation = useMemoOne(() => {
    return cond(
      greaterThan(animatedValue, 0),
      interpolate(animatedValue, {
        extrapolate: Animated.Extrapolate.CLAMP,
        inputRange: [30, 100],
        outputRange: [5, 0],
      }),
      divide(1, animatedValue)
    );
  }, [animatedValue]);

  return (
    <Container>
      <ScaleInAnimation scaleTo={0.001} value={animation}>
        <Icon
          color={colors.whiteLabel}
          name="progress"
          progress={animatedValue}
        />
      </ScaleInAnimation>
    </Container>
  );
}
