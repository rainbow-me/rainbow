import { pick } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { deviceUtils } from '../../utils';
import { removeLeadingZeros } from '../../utils/formatters';
import { ColumnWithMargins } from '../layout';
import SendAssetFormField from './SendAssetFormField';

const SendAssetFormToken = ({
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
}) => {
  const {
    mask: nativeMask,
    placeholder: nativePlaceholder,
  } = pick(supportedNativeCurrencies[nativeCurrency], ['mask', 'placeholder']);

  return (
    <Fragment>
      <ColumnWithMargins {...props} flex={0} margin={18} width="100%">
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
      <ColumnWithMargins
        flex={0}
        margin={deviceUtils.dimensions.height < 812 ? 15.5 : 31}
        style={{ zIndex: 3 }}
        width="100%"
      >
        {buttonRenderer}
        {txSpeedRenderer}
      </ColumnWithMargins>
    </Fragment>
  );
};

SendAssetFormToken.propTypes = {
  assetAmount: PropTypes.string,
  buttonRenderer: PropTypes.object,
  nativeAmount: PropTypes.string,
  nativeCurrency: PropTypes.string,
  onChangeAssetAmount: PropTypes.func,
  onChangeNativeAmount: PropTypes.func,
  selected: PropTypes.object,
  sendMaxBalance: PropTypes.func,
  txSpeedRenderer: PropTypes.object,
};

export default SendAssetFormToken;
