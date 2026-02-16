import React from 'react';
import magicMemo from '@/utils/magicMemo';
import OpacityToggler from '../animations/OpacityToggler';
import { Text } from '../text';
import styled from '@/styled-thing';
import { opacity } from '@/framework/ui/utils/opacity';

const LabelText = styled(Text).attrs(({ shareButton, theme: { colors } }) => ({
  color: opacity(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  lineHeight: 30,
  size: 'lmedium',
  weight: shareButton ? 'heavy' : 'bold',
}))(({ shareButton }) => ({
  ...(!shareButton ? { position: 'absolute' } : { width: '100%', lineHeight: 22 }),
  ...(!shareButton ? { top: -15.5 } : { top: -2 }),
}));

const CoinDividerButtonLabel = ({ align, isVisible, label, shareButton }) => (
  <OpacityToggler isVisible={isVisible}>
    <LabelText align={align} shareButton={shareButton}>
      {label}
    </LabelText>
  </OpacityToggler>
);

export default magicMemo(CoinDividerButtonLabel, 'isVisible');
