import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins, Row } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeField' was resolved to '/Users/n... Remove this comment to see the full error message
import ExchangeField from './ExchangeField';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeMaxButton' was resolved to '/Use... Remove this comment to see the full error message
import ExchangeMaxButton from './ExchangeMaxButton';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeNativeField' was resolved to '/U... Remove this comment to see the full error message
import ExchangeNativeField from './ExchangeNativeField';

const Container = styled(ColumnWithMargins).attrs({ margin: 5 })`
  padding-top: 6;
  width: 100%;
  z-index: 1;
`;

const NativeFieldRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  height: ${android ? 16 : 32};
  padding-left: 19;
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
  testID,
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ExchangeField
        address={inputCurrencyAddress}
        amount={inputAmount}
        disableCurrencySelection={disableInputCurrencySelection}
        editable={!!inputCurrencySymbol}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectInputCurrency}
        ref={inputFieldRef}
        setAmount={setInputAmount}
        symbol={inputCurrencySymbol}
        testID={testID}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        useCustomAndroidMask={android}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <NativeFieldRow>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ExchangeNativeField
          address={inputCurrencyAddress}
          editable
          height={64}
          nativeAmount={nativeAmount}
          nativeCurrency={nativeCurrency}
          onFocus={onFocus}
          ref={nativeFieldRef}
          setNativeAmount={setNativeAmount}
          testID={testID + '-native'}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ExchangeMaxButton
          address={inputCurrencyAddress}
          disabled={!inputCurrencySymbol}
          onPress={onPressMaxBalance}
          testID={testID + '-max'}
        />
      </NativeFieldRow>
    </Container>
  );
}
