import React from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { OpacityToggler } from '../animations';
import { Text } from '../text';

const LabelText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'bold',
}))`
  position: absolute;
  top: ${android ? -15.25 : -10.25};
  width: ${({ shareButton }) => shareButton && '100%'};
`;

const CoinDividerButtonLabel = ({ align, isVisible, label, shareButton }) => (
  <OpacityToggler isVisible={isVisible}>
    <LabelText align={align} shareButton={shareButton}>
      {label}
    </LabelText>
  </OpacityToggler>
);

export default magicMemo(CoinDividerButtonLabel, 'isVisible');
