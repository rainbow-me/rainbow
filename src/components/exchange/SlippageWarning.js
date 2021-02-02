import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { useSlippageDetails } from '@rainbow-me/hooks';
import { padding, position } from '@rainbow-me/styles';

const AnimatedButtonPressAnimation = Animated.createAnimatedComponent(
  ButtonPressAnimation
);

const Container = styled(Centered).attrs({
  shrink: 0,
})`
  ${padding(19)};
  width: 100%;
`;

const Label = styled(Text).attrs(
  ({ theme: { colors }, color = colors.white, letterSpacing }) => ({
    color,
    letterSpacing,
    size: 'large',
    weight: 'bold',
  })
)``;

export default function SlippageWarning({ onPress, ...props }) {
  const { color } = useSlippageDetails();

  return (
    <AnimatedButtonPressAnimation
      {...position.coverAsObject}
      onPress={onPress}
      scaleTo={1.06}
      {...props}
    >
      <Container>
        <Label color={color}>{`􀇿 `}</Label>
        <Label>Small Market</Label>
        <Label color={color}>{` • Losing `}</Label>
        <Label color={color} letterSpacing="roundedTight">
          $TODO
        </Label>
      </Container>
    </AnimatedButtonPressAnimation>
  );
}
