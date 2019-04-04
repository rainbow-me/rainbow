import { withAccountAssets } from '@rainbow-me/rainbow-common';
import {
  get,
  isEmpty,
  isFunction,
  isString,
  map,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { Column } from '../components/layout';
import {
  SendAssetForm,
  SendAssetList,
  SendButton,
  SendEmptyState,
  SendHeader,
  SendTransactionSpeed,
} from '../components/send';
import { withAccountRefresh, withAccountSettings } from '../hoc';
import { colors } from '../styles';
import { deviceUtils } from '../utils';
import { showActionSheetWithOptions } from '../utils/actionsheet';
import { uppercase } from '../utils/formatters';

const Container = styled(Column)`
  background-color: ${colors.white};
  height: 100%;
`;

const formatGasSpeedItems = (gasPrices) => ([
  { label: 'Cancel' },
  ...map(gasPrices, (value, key) => {
    const cost = get(value, 'txFee.native.value.display');
    const time = get(value, 'estimatedTime.display');

    return {
      label: `${uppercase(key, 7)}: ${cost}  ~${time.slice(0, -1)}`,
      value: key,
    };
  }),
]);

class SendSheet extends Component {
  static propTypes = {
    allAssets: PropTypes.array,
    assetAmount: PropTypes.string,
    fetchData: PropTypes.func,
    gasPrice: PropTypes.object,
    gasPrices: PropTypes.object,
    isSufficientBalance: PropTypes.bool,
    isSufficientGas: PropTypes.bool,
    isValidAddress: PropTypes.bool,
    nativeCurrencySymbol: PropTypes.string,
    navigation: PropTypes.object,
    onSubmit: PropTypes.func,
    recipient: PropTypes.string,
    selected: PropTypes.object,
    sendClearFields: PropTypes.func,
    sendMaxBalance: PropTypes.func,
    sendUpdateAssetAmount: PropTypes.func,
    sendUpdateGasPrice: PropTypes.func,
    sendUpdateNativeAmount: PropTypes.func,
    sendUpdateRecipient: PropTypes.func,
    sendUpdateSelected: PropTypes.func,
    uniqueTokens: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    isSufficientBalance: false,
    isSufficientGas: false,
    isValidAddress: false,
  }

  state = {
    isAuthorizing: false,
  }

  componentDidMount() {
    const { navigation, sendUpdateRecipient } = this.props;
    const address = get(navigation, 'state.params.address');

    if (address) {
      sendUpdateRecipient(address);
    }
  }

  componentDidUpdate(prevProps) {
    const {
      isValidAddress,
      navigation,
      selected,
      sendUpdateSelected,
    } = this.props;

    const asset = get(navigation, 'state.params.asset');

    if (isValidAddress && !prevProps.isValidAddress) {
      if (asset) {
        sendUpdateSelected(asset);
      }

      Keyboard.dismiss();
    }

    if (prevProps.isValidAddress !== isValidAddress
        || prevProps.selected !== selected) {
      let verticalGestureResponseDistance = 0;

      if (isValidAddress) {
        verticalGestureResponseDistance = isEmpty(selected) ? 150 : deviceUtils.dimensions.height;
      } else {
        verticalGestureResponseDistance = deviceUtils.dimensions.height;
      }

      navigation.setParams({ verticalGestureResponseDistance });
    }
  }

  componentWillUnmount() {
    this.props.sendClearFields();
  }

  onChangeAssetAmount = (assetAmount) => {
    if (isString(assetAmount)) {
      this.props.sendUpdateAssetAmount(assetAmount);
    }
  }

  onChangeNativeAmount = (nativeAmount) => {
    if (isString(nativeAmount)) {
      this.props.sendUpdateNativeAmount(nativeAmount);
    }
  }

  onLongPressSend = () => {
    this.setState({ isAuthorizing: true });

    if (isIphoneX()) {
      this.sendTransaction();
    } else {
      this.onPressTransactionSpeed(this.sendTransaction);
    }
  }

  onPressTransactionSpeed = onSuccess => {
    const options = formatGasSpeedItems(this.props.gasPrices);

    showActionSheetWithOptions({
      cancelButtonIndex: 0,
      options: options.map(option => option.label),
    }, (buttonIndex) => {
      if (buttonIndex > 0) {
        this.props.sendUpdateGasPrice(options[buttonIndex].value);
      }

      if (isFunction(onSuccess)) {
        onSuccess();
      }
    });
  }

  onResetAssetSelection = () => this.props.sendUpdateSelected('')

  onSelectAsset = symbol => () => this.props.sendUpdateSelected(symbol)

  sendTransaction = () => {
    const {
      assetAmount,
      navigation,
      onSubmit,
      sendClearFields,
    } = this.props;

    if (Number(assetAmount) <= 0) return false;

    return onSubmit().then(() => {
      this.setState({ isAuthorizing: false });
      sendClearFields();
      navigation.navigate('ProfileScreen');
    });
  }

  render() {
    const {
      allAssets,
      fetchData,
      gasPrice,
      isValidAddress,
      nativeCurrencySymbol,
      recipient,
      selected,
      sendUpdateRecipient,
      uniqueTokens,
      ...props
    } = this.props;

    const showEmptyState = !isValidAddress;
    const showAssetList = isValidAddress && isEmpty(selected);
    const showAssetForm = isValidAddress && !isEmpty(selected);

    return (
      <Container>
        <KeyboardAvoidingView behavior="padding" enabled={!showAssetList}>
          <Container align="center">
            <SendHeader
              isValid={isValidAddress}
              onChangeAddressInput={sendUpdateRecipient}
              recipient={recipient}
            />
            {showEmptyState && <SendEmptyState onPressPaste={sendUpdateRecipient} />}
            {showAssetList && (
              <SendAssetList
                allAssets={allAssets}
                fetchData={fetchData}
                onSelectAsset={this.onSelectAsset}
                uniquetokens={uniqueTokens}
              />
            )}
            {showAssetForm && (
              <SendAssetForm
                {...props}
                allAssets={allAssets}
                buttonRenderer={(
                  <SendButton
                    {...props}
                    isAuthorizing={this.state.isAuthorizing}
                    onLongPress={this.onLongPressSend}
                  />
                )}
                onChangeAssetAmount={this.onChangeAssetAmount}
                onChangeNativeAmount={this.onChangeNativeAmount}
                onResetAssetSelection={this.onResetAssetSelection}
                selected={selected}
                txSpeedRenderer={(
                  isIphoneX() && (
                    <SendTransactionSpeed
                      gasPrice={gasPrice}
                      nativeCurrencySymbol={nativeCurrencySymbol}
                      onPressTransactionSpeed={this.onPressTransactionSpeed}
                    />
                  )
                )}
              />
            )}
          </Container>
        </KeyboardAvoidingView>
      </Container>
    );
  }
}

export default compose(
  withAccountAssets,
  withAccountSettings,
  withAccountRefresh,
  withHandlers({
    fetchData: ({ refreshAccount }) => async () => {
      await refreshAccount();
    },
  }),
)(SendSheet);
