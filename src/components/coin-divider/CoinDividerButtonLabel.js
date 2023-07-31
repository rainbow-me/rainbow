import React from 'react';
import { magicMemo } from '../../utils';
import { OpacityToggler } from '../animations';
import { Text } from '../text';
import styled from '@/styled-thing';

const LabelText = styled(Text).attrs(({ shareButton, theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: shareButton ? 'zero' : 'roundedTight',
  lineHeight: 30,
  size: shareButton ? 'smedium' : 'lmedium',
  weight: shareButton ? 'heavy' : 'bold',
}))(({ shareButton }) => ({
  position: 'absolute',
  ...(shareButton ? { width: '100%' } : {}),
  top: -15,
}));

const CoinDividerButtonLabel = ({ align, isVisible, label, shareButton }) => (
  <OpacityToggler isVisible={isVisible}>
    <LabelText align={align} shareButton={shareButton}>
      {label}
    </LabelText>
  </OpacityToggler>
);

export default magicMemo(CoinDividerButtonLabel, 'isVisible');
