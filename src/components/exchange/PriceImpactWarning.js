import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { padding, position } from '@rainbow-me/styles';

const Content = styled(Centered).attrs({
  shrink: 0,
})`
  ${padding(android ? 14 : 19)};
  width: 100%;
`;

const Label = styled(Text).attrs(
  ({ theme: { colors }, color = colors.blueGreyDark80, letterSpacing }) => ({
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
  priceImpactPercentDisplay,
  style,
  ...props
}) {
  const heading = priceImpactNativeAmount ? 'Losing' : 'Price impact';
  const headingValue =
    priceImpactNativeAmount ?? `${priceImpactPercentDisplay}%`;
  return (
    <Animated.View {...props} style={[style, position.coverAsObject]}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.94}>
        <Content>
          <Label color={priceImpactColor}>{`􀇿 `}</Label>
          <Label>Small Market</Label>
          <Label color={priceImpactColor}>{` • ${heading} `}</Label>
          <Label color={priceImpactColor} letterSpacing="roundedTight">
            {headingValue}
          </Label>
        </Content>
      </ButtonPressAnimation>
    </Animated.View>
  );
}
