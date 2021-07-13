import React from 'react';
import styled from 'styled-components';
import { Row } from '../layout';
import ExchangeField from './ExchangeField';

const paddingTop = android ? 15 : 32;

const Container = styled(Row).attrs({ align: 'center' })`
  overflow: hidden;
  padding-bottom: 21;
  padding-top: ${paddingTop};
  width: 100%;
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
