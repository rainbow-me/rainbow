import React from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { lightModeThemeColors, padding } from '@rainbow-me/styles';

const ExchangeDetailsButtonLabel = styled(Text).attrs({
  color: lightModeThemeColors.white,
  size: 'large',
  weight: 'bold',
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ...(android && { lineHeight: 21 }),
})`
  ${padding(9)};
`;

export default function ExchangeDetailsButton({
  children,
  disabled,
  onPress,
  ...props
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      {...props}
      disabled={disabled}
      onPress={onPress}
      scaleTo={1.0666}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ExchangeDetailsButtonLabel>{children}</ExchangeDetailsButtonLabel>
    </ButtonPressAnimation>
  );
}
