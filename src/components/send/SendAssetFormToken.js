import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers } from 'recompact';
import { withAccountSettings } from '../../hoc';
import { removeLeadingZeros } from '../../utils/formatters';
import { ColumnWithMargins } from '../layout';
import SendAssetFormField from './SendAssetFormField';

const SendAssetFormToken = ({
  assetAmount,
  formatNativeInput,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  selected,
  sendMaxBalance,
  ...props
}) => (
  <ColumnWithMargins
    {...props}
    flex={0}
    margin={18}
    width="100%"
  >
    <SendAssetFormField
      autoFocus={true}
      format={removeLeadingZeros}
      label={selected.symbol}
      onChange={onChangeAssetAmount}
      onPressButton={sendMaxBalance}
      placeholder="0"
      value={assetAmount}
    />
    <SendAssetFormField
      format={formatNativeInput}
      label={nativeCurrency}
      onChange={onChangeNativeAmount}
      onPressButton={sendMaxBalance}
      placeholder="0.00"
      value={nativeAmount}
    />
  </ColumnWithMargins>
);

SendAssetFormToken.propTypes = {
  assetAmount: PropTypes.string,
  formatNativeInput: PropTypes.func,
  nativeAmount: PropTypes.string,
  nativeCurrency: PropTypes.string,
  onChangeAssetAmount: PropTypes.func,
  onChangeNativeAmount: PropTypes.func,
  onResetAssetSelection: PropTypes.func,
  selected: PropTypes.object,
  sendMaxBalance: PropTypes.func,
};

export default compose(
  withAccountSettings,
  withHandlers({
    formatNativeInput: ({ nativeCurrency }) => (value = '') => {
      const nativeCurrencyDecimals = (nativeCurrency !== 'ETH') ? 2 : 18;
      const formattedValue = removeLeadingZeros(value);
      const parts = formattedValue.split('.');
      const decimals = parts[1] || '';

      return (decimals.length > nativeCurrencyDecimals)
        ? `${parts[0]}.${decimals.substring(0, nativeCurrencyDecimals)}`
        : formattedValue;
    },
  }),
)(SendAssetFormToken);
