import React from 'react';
import { Row } from '../layout';
import ExchangeField from './ExchangeField';
import styled from 'styled-components';

const paddingTop = android ? 15 : 32;

const Container = styled(Row).attrs({ align: 'center' })({
  overflow: 'hidden',
  paddingBottom: 21,
  paddingTop,
  width: '100%',
});

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
