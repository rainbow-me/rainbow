import lang from 'i18n-js';
import React from 'react';
import Animated from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import { Box, Inline } from '@/design-system';
import styled from '@/styled-thing';
import { position } from '@/styles';

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
)({});

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
      {isHighPriceImpact && headingValue && (
        <ButtonPressAnimation onPress={onPress} scaleTo={0.94}>
          <Box
            paddingHorizontal="19px (Deprecated)"
            paddingTop="19px (Deprecated)"
          >
            <Inline alignHorizontal="center">
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
            </Inline>
          </Box>
        </ButtonPressAnimation>
      )}
    </Animated.View>
  );
}
