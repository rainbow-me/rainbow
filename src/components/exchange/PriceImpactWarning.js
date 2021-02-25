import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
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

export default function PriceImpactWarning({
  onPress,
  priceImpactColor,
  priceImpactNativeAmount,
  style,
  ...props
}) {
  return (
    <Animated.View {...props} style={style}>
      <ButtonPressAnimation
        {...position.coverAsObject}
        onPress={onPress}
        scaleTo={1.06}
      >
        <Container>
          <Label color={priceImpactColor}>{`􀇿 `}</Label>
          <Label>Small Market</Label>
          <Label color={priceImpactColor}>{` • Losing `}</Label>
          <Label color={priceImpactColor} letterSpacing="roundedTight">
            {priceImpactNativeAmount}
          </Label>
        </Container>
      </ButtonPressAnimation>
    </Animated.View>
  );
}
