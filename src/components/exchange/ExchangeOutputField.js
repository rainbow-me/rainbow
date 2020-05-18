import React from 'react';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { borders, colors } from '../../styles';
import { Row } from '../layout';
import ExchangeField from './ExchangeField';

const paddingValue = 15;

const FakeNotchShadow = [
  [0, 0, 1, colors.dark, 0.01],
  [0, 4, 12, colors.dark, 0.04],
  [0, 8, 23, colors.dark, 0.05],
];

const Container = styled(Row).attrs({ align: 'center' })`
  ${borders.buildRadius('bottom', 30)};
  background-color: ${colors.white};
  overflow: hidden;
  padding-bottom: 26;
  padding-top: ${24 + paddingValue};
  width: 100%;
`;

const FakeNotchThing = styled(ShadowStack).attrs({
  shadows: FakeNotchShadow,
})`
  height: ${paddingValue};
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
      />
    </Container>
  );
}
