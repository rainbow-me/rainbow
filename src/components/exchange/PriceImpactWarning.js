import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { usePriceImpactDetails } from '@rainbow-me/hooks';
import { padding, position } from '@rainbow-me/styles';

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

export default function PriceImpactWarning({ onPress, style, ...props }) {
  const { color, priceImpactNativeAmount } = usePriceImpactDetails();

  return (
    <Animated.View {...props} style={style}>
      <ButtonPressAnimation
        {...position.coverAsObject}
        onPress={onPress}
        scaleTo={1.06}
      >
        <Container>
          <Label color={color}>{`􀇿 `}</Label>
          <Label>Small Market</Label>
          <Label color={color}>{` • Losing `}</Label>
          <Label color={color} letterSpacing="roundedTight">
            {priceImpactNativeAmount}
          </Label>
        </Container>
      </ButtonPressAnimation>
    </Animated.View>
  );
}
