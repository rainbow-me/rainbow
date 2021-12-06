import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';

const Content = styled(Centered).attrs({
  shrink: 0,
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
}: any) {
  const headingValue = priceImpactNativeAmount ?? priceImpactPercentDisplay;
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View {...props} style={[style, position.coverAsObject]}>
      {isHighPriceImpact && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ButtonPressAnimation onPress={onPress} scaleTo={0.94}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Content>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Label color={priceImpactColor}>{`􀇿 `}</Label>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Label color="whiteLabel">Small Market</Label>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Label color={priceImpactColor}>{` • Losing `}</Label>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Label color={priceImpactColor} letterSpacing="roundedTight">
              {headingValue}
            </Label>
          </Content>
        </ButtonPressAnimation>
      )}
    </Animated.View>
  );
}
