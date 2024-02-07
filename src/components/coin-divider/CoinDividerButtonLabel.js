import React from 'react';
import { magicMemo } from '../../utils';
import { OpacityToggler } from '../animations';
import { Text } from '../text';
import styled from '@/styled-thing';

const LabelText = styled(Text).attrs(({ shareButton, theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  lineHeight: 30,
  size: 'lmedium',
  weight: shareButton ? 'heavy' : 'bold',
}))(({ shareButton }) => ({
  ...(!shareButton ? { position: 'absolute' } : { width: '100%', lineHeight: 22 }),
  ...(!shareButton ? { top: android ? -15 : -15.5 } : { top: android ? -2 : -2 }),
}));

const CoinDividerButtonLabel = ({ align, isVisible, label, shareButton }) => (
  <OpacityToggler isVisible={isVisible}>
    <LabelText align={align} shareButton={shareButton}>
      {label}
    </LabelText>
  </OpacityToggler>
);

export default magicMemo(CoinDividerButtonLabel, 'isVisible');
