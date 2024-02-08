import lang from 'i18n-js';
import React from 'react';
import { StyleProp, ViewProps, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { Box, ColorModeProvider, Inline, Text } from '@/design-system';
import { position } from '@/styles';

interface PriceImpactWarningProps extends ViewProps {
  onPress: () => void;
  isHighPriceImpact: boolean;
  priceImpactColor?: string;
  priceImpactNativeAmount?: string | null;
  priceImpactPercentDisplay?: string | null;
  style?: StyleProp<ViewStyle>;
}

export default function PriceImpactWarning({
  onPress,
  isHighPriceImpact,
  priceImpactColor = 'primary',
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
  style,
  ...props
}: PriceImpactWarningProps) {
  const headingValue = priceImpactNativeAmount ?? priceImpactPercentDisplay;
  return (
    <ColorModeProvider value="dark">
      <Animated.View {...props} style={[style, position.coverAsObject]}>
        {isHighPriceImpact && headingValue && (
          <ButtonPressAnimation onPress={onPress} scaleTo={0.94}>
            <Box paddingHorizontal="19px (Deprecated)" paddingTop="19px (Deprecated)">
              <Inline alignHorizontal="center">
                <Text weight="bold" size="17pt" color={{ custom: priceImpactColor }}>{`􀇿 `}</Text>
                <Text weight="bold" size="17pt" color="primary (Deprecated)">
                  {lang.t('exchange.price_impact.small_market')}
                </Text>
                <Text
                  weight="bold"
                  size="17pt"
                  color={{ custom: priceImpactColor }}
                >{` • ${lang.t('exchange.price_impact.losing_prefix')} `}</Text>
                <Text weight="bold" size="17pt" color={{ custom: priceImpactColor }}>
                  {headingValue}
                </Text>
              </Inline>
            </Box>
          </ButtonPressAnimation>
        )}
      </Animated.View>
    </ColorModeProvider>
  );
}
