import React from 'react';
import styled from 'styled-components';
import { Row } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeField' was resolved to '/Users/n... Remove this comment to see the full error message
import ExchangeField from './ExchangeField';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ExchangeField
        address={outputCurrencyAddress}
        amount={outputAmount}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectOutputCurrency}
        ref={outputFieldRef}
        setAmount={setOutputAmount}
        symbol={outputCurrencySymbol}
        testID={testID}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        useCustomAndroidMask={android}
      />
    </Container>
  );
}
