import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers } from 'recompact';
import { withAccountSettings } from '../../hoc';
import { deviceUtils } from '../../utils';
import { removeLeadingZeros } from '../../utils/formatters';
import { ColumnWithMargins } from '../layout';
import SendAssetFormField from './SendAssetFormField';

const SendAssetFormToken = ({
  assetAmount,
  buttonRenderer,
  formatNativeInput,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}) => (
  <>
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
        format={formatNativeInput}
        label={nativeCurrency}
        onChange={onChangeNativeAmount}
        onPressButton={sendMaxBalance}
        placeholder="0.00"
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
  </>
);

SendAssetFormToken.propTypes = {
  assetAmount: PropTypes.string,
  buttonRenderer: PropTypes.object,
  formatNativeInput: PropTypes.func,
  nativeAmount: PropTypes.string,
  nativeCurrency: PropTypes.string,
  onChangeAssetAmount: PropTypes.func,
  onChangeNativeAmount: PropTypes.func,
  onResetAssetSelection: PropTypes.func,
  selected: PropTypes.object,
  sendMaxBalance: PropTypes.func,
  txSpeedRenderer: PropTypes.object,
};

export default compose(
  withAccountSettings,
  withHandlers({
    formatNativeInput: ({ nativeCurrency }) => (value = '') => {
      const nativeCurrencyDecimals = nativeCurrency !== 'ETH' ? 2 : 18;
      const formattedValue = removeLeadingZeros(value);
      const parts = formattedValue.split('.');
      const decimals = parts[1] || '';

      return decimals.length > nativeCurrencyDecimals
        ? `${parts[0]}.${decimals.substring(0, nativeCurrencyDecimals)}`
        : formattedValue;
    },
  })
)(SendAssetFormToken);
