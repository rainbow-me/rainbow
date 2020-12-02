import React from 'react';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import ExchangeField from './ExchangeField';
import { colors } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const notchPaddingValue = 11;
const paddingTop = android ? 15 : 39;

const FakeNotchShadow = [
  [0, 0, 1, colors.dark, 0.01],
  [0, 4, 12, colors.dark, 0.04],
  [0, 8, 23, colors.dark, 0.05],
];

const Container = styled(Row).attrs({ align: 'center' })`
  overflow: hidden;
  padding-bottom: 21;
  padding-top: ${paddingTop};
  width: 100%;
`;

const FakeNotchThing = styled(ShadowStack).attrs({
  shadows: FakeNotchShadow,
})`
  height: ${notchPaddingValue};
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 0;
`;

export default function ExchangeOutputField({
  onFocus,
  onPressSelectOutputCurrency,
  outputAmount,
  outputCurrencyAddress,
  outputCurrencySymbol,
  outputFieldRef,
  setOutputAmount,
  testID,
}) {
  return (
    <Container>
      <FakeNotchThing />
      <ExchangeField
        address={outputCurrencyAddress}
        amount={outputAmount}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectOutputCurrency}
        ref={outputFieldRef}
        setAmount={setOutputAmount}
        symbol={outputCurrencySymbol}
        testID={testID}
        useCustomAndroidMask={android}
      />
    </Container>
  );
}
