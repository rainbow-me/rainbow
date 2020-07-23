import { pick } from 'lodash';
import React, { Fragment, useMemo } from 'react';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { removeLeadingZeros } from '../../utils/formatters';
import { Column, ColumnWithMargins } from '../layout';
import SendAssetFormField from './SendAssetFormField';

const FooterContainer = styled(ColumnWithMargins).attrs({
  justify: 'end',
})`
  flex: 1;
  width: 100%;
  z-index: 3;
`;

const FormContainer = styled(Column)`
  flex: 1;
  width: 100%;
`;

const getConfigForCurrency = nativeCurrency =>
  pick(supportedNativeCurrencies[nativeCurrency], ['mask', 'placeholder']);

export default function SendAssetFormToken({
  assetAmount,
  buttonRenderer,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  onFocus,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}) {
  const { height: deviceHeight } = useDimensions();

  const { mask: nativeMask, placeholder: nativePlaceholder } = useMemo(
    () => getConfigForCurrency(nativeCurrency),
    [nativeCurrency]
  );

  return (
    <Fragment>
      <FormContainer {...props}>
        <SendAssetFormField
          format={removeLeadingZeros}
          label={selected.symbol}
          onChange={onChangeAssetAmount}
          onFocus={onFocus}
          onPressButton={sendMaxBalance}
          placeholder="0"
          value={assetAmount}
        />
        <SendAssetFormField
          autoFocus
          label={nativeCurrency}
          mask={nativeMask}
          onChange={onChangeNativeAmount}
          onFocus={onFocus}
          onPressButton={sendMaxBalance}
          placeholder={nativePlaceholder}
          value={nativeAmount}
        />
      </FormContainer>
      <FooterContainer margin={deviceHeight < 812 ? 15.5 : 31}>
        {buttonRenderer}
        {txSpeedRenderer}
      </FooterContainer>
    </Fragment>
  );
}
