import React from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { ColumnWithMargins, Row } from '../layout';
import ExchangeField from './ExchangeField';
import ExchangeMaxButton from './ExchangeMaxButton';
import ExchangeNativeField from './ExchangeNativeField';

const BottomRowHeight = 32;

const Container = styled(ColumnWithMargins).attrs({ margin: 12 })`
  background-color: ${colors.white};
  padding-top: 6;
  width: 100%;
  z-index: 1;
`;

const NativeFieldRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  height: ${BottomRowHeight};
  padding-left: 15;
`;

export default function ExchangeInputField({
  disableInputCurrencySelection,
  inputAmount,
  inputCurrencyAddress,
  inputCurrencySymbol,
  inputFieldRef,
  nativeAmount,
  nativeCurrency,
  nativeFieldRef,
  onFocus,
  onPressMaxBalance,
  onPressSelectInputCurrency,
  setInputAmount,
  setNativeAmount,
}) {
  return (
    <Container>
      <ExchangeField
        address={inputCurrencyAddress}
        amount={inputAmount}
        disableCurrencySelection={disableInputCurrencySelection}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectInputCurrency}
        ref={inputFieldRef}
        setAmount={setInputAmount}
        symbol={inputCurrencySymbol}
      />
      <NativeFieldRow>
        <ExchangeNativeField
          editable={!!inputCurrencySymbol}
          height={BottomRowHeight}
          nativeAmount={nativeAmount}
          nativeCurrency={nativeCurrency}
          onFocus={onFocus}
          ref={nativeFieldRef}
          setNativeAmount={setNativeAmount}
        />
        <ExchangeMaxButton
          disabled={!inputCurrencySymbol}
          onPress={onPressMaxBalance}
        />
      </NativeFieldRow>
    </Container>
  );
}
