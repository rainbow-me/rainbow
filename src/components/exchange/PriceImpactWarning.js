import lang from 'i18n-js';
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
  ({
    theme: { colors },
    color = colors.alpha(colors.blueGreyDark, 0.8),
    letterSpacing,
  }) => ({
    color,
    letterSpacing,
    size: 'large',
    weight: 'bold',
  })
)``;

export default function PriceImpactWarning({
  onPress,
  isHighPriceImpact,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
  style,
  ...props
}) {
  const headingValue = priceImpactNativeAmount ?? priceImpactPercentDisplay;
  return (
    <Animated.View {...props} style={[style, position.coverAsObject]}>
      {isHighPriceImpact && (
        <ButtonPressAnimation onPress={onPress} scaleTo={0.94}>
          <Content>
            <Label color={priceImpactColor}>{`􀇿 `}</Label>
            <Label color="whiteLabel">
              {lang.t('exchange.price_impact.small_market')}
            </Label>
            <Label color={priceImpactColor}>{` • ${lang.t(
              'exchange.price_impact.losing_prefix'
            )} `}</Label>
            <Label color={priceImpactColor} letterSpacing="roundedTight">
              {headingValue}
            </Label>
          </Content>
        </ButtonPressAnimation>
      )}
    </Animated.View>
  );
}
