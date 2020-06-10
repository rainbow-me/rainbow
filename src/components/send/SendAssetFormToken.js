import { pick } from 'lodash';
import React, { Fragment, useMemo } from 'react';
import styled from 'styled-components/primitives';
import { useDimensions } from '../../hooks';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { removeLeadingZeros } from '../../utils/formatters';
import { ColumnWithMargins } from '../layout';
import SendAssetFormField from './SendAssetFormField';

const FooterContainer = styled(ColumnWithMargins)`
  width: 100%;
  z-index: 3;
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
      <ColumnWithMargins {...props} margin={18} width="100%">
        <SendAssetFormField
          format={removeLeadingZeros}
          label={selected.symbol}
          onChange={onChangeAssetAmount}
          onPressButton={sendMaxBalance}
          placeholder="0"
          value={assetAmount}
        />
        <SendAssetFormField
          autoFocus
          label={nativeCurrency}
          mask={nativeMask}
          onChange={onChangeNativeAmount}
          onPressButton={sendMaxBalance}
          placeholder={nativePlaceholder}
          value={nativeAmount}
        />
      </ColumnWithMargins>
      <FooterContainer margin={deviceHeight < 812 ? 15.5 : 31}>
        {buttonRenderer}
        {txSpeedRenderer}
      </FooterContainer>
    </Fragment>
  );
}
