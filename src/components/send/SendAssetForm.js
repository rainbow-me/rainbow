import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountSettings } from '../../hoc';
import transitions from '../../navigation/transitions';
import { colors, padding, position } from '../../styles';
import { deviceUtils } from '../../utils';
import { removeLeadingZeros } from '../../utils/formatters';
import { SendCoinRow } from '../coin-row';
import { DoubleArrowSelectionIcon } from '../icons';
import { Column, ColumnWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import SendAssetFormField from './SendAssetFormField';

const Container = styled(Column)`
  ${position.size('100%')};
  background-color: ${colors.white};
  flex: 1;
  overflow: hidden;
`;

const TransactionContainer = styled(Column).attrs({
  align: 'end',
  justify: 'space-between',
})`
  ${padding(22, 15, 19 + transitions.sheetVerticalOffset)}
  background-color: ${colors.lightGrey};
  flex: 1;
  width: 100%;
`;

const SendAssetForm = ({
  allAssets,
  assetAmount,
  buttonRenderer,
  formatNativeInput,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  onResetAssetSelection,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
}) => {
  const selectedAsset = allAssets.find(asset => asset.symbol === selected.symbol);

  return (
    <Container>
      <ShadowStack
        borderRadius={0}
        flex={0}
        height={SendCoinRow.selectedHeight}
        shadows={[
          [0, 1, 0, colors.dark, 0.01],
          [0, 4, 12, colors.dark, 0.04],
          [0, 8, 23, colors.dark, 0.05],
        ]}
        shouldRasterizeIOS={true}
        width={deviceUtils.dimensions.width}
      >
        <SendCoinRow
          item={selectedAsset}
          onPress={onResetAssetSelection}
          selected={true}
        >
          <DoubleArrowSelectionIcon />
        </SendCoinRow>
      </ShadowStack>
      <TransactionContainer>
        <ColumnWithMargins flex={0} margin={18} width="100%">
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
        <ColumnWithMargins
          flex={0}
          width="100%"
          margin={(deviceUtils.dimensions.height < 812) ? 15.5 : 31}
        >
          {buttonRenderer}
          {txSpeedRenderer}
        </ColumnWithMargins>
      </TransactionContainer>
    </Container>
  );
};

SendAssetForm.propTypes = {
  allAssets: PropTypes.array,
  assetAmount: PropTypes.string,
  buttonRenderer: PropTypes.node,
  formatNativeInput: PropTypes.func,
  nativeAmount: PropTypes.string,
  nativeCurrency: PropTypes.string,
  onChangeAssetAmount: PropTypes.func,
  onChangeNativeAmount: PropTypes.func,
  onResetAssetSelection: PropTypes.func,
  selected: PropTypes.object,
  sendMaxBalance: PropTypes.func,
  txSpeedRenderer: PropTypes.node,
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
)(SendAssetForm);
