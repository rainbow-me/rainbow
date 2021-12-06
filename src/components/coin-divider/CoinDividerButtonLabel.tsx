import React from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { OpacityToggler } from '../animations';
import { Text } from '../text';

const LabelText = styled(Text).attrs(({ shareButton, theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  lineHeight: 30,
  size: 'lmedium',
  weight: shareButton ? 'heavy' : 'bold',
}))`
  position: absolute;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  top: ${android ? -15 : -15.5};
  ${({ shareButton }) => shareButton && `width:  100%;`};
`;

const CoinDividerButtonLabel = ({
  align,
  isVisible,
  label,
  shareButton,
}: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <OpacityToggler isVisible={isVisible}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <LabelText align={align} shareButton={shareButton}>
      {label}
    </LabelText>
  </OpacityToggler>
);

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(CoinDividerButtonLabel, 'isVisible');
