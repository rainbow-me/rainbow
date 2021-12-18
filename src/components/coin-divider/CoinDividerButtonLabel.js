import React from 'react';
import { magicMemo } from '../../utils';
import { OpacityToggler } from '../animations';
import { Text } from '../text';
import styled from '@rainbow-me/styled';

const LabelText = styled(Text).attrs(({ shareButton, theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  lineHeight: 30,
  size: 'lmedium',
  weight: shareButton ? 'heavy' : 'bold',
}))(({ shareButton }) => ({
  position: 'absolute',
  ...(shareButton ? { width: '100%' } : {}),
  top: android ? -15 : -15.5,
}));

const CoinDividerButtonLabel = ({ align, isVisible, label, shareButton }) => (
  <OpacityToggler isVisible={isVisible}>
    <LabelText align={align} shareButton={shareButton}>
      {label}
    </LabelText>
  </OpacityToggler>
);

export default magicMemo(CoinDividerButtonLabel, 'isVisible');
