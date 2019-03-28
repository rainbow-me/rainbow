import {
  get,
  isEmpty,
  isString,
  map,
} from 'lodash';
import PropTypes from 'prop-types';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import React, { Component } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { compose, withHandlers } from 'recompact';
import { Column } from '../components/layout';
import { withAccountRefresh, withAccountSettings } from '../hoc';
import { colors } from '../styles';
import { deviceUtils } from '../utils';
import { showActionSheetWithOptions } from '../utils/actionsheet';
import { uppercase } from '../utils/formatters';

import {
  SendAssetForm,
  SendAssetList,
  SendButton,
  SendEmptyState,
  SendHeader,
  SendTransactionSpeed,
} from '../components/send';

class SendSheet extends Component {
  static propTypes = {
    allAssets: PropTypes.array,
    fetchData: PropTypes.func,
    isSufficientBalance: PropTypes.bool,
    isSufficientGas: PropTypes.bool,
    isValidAddress: PropTypes.bool,
    selected: PropTypes.object,
    sendClearFields: PropTypes.func,
    sendMaxBalance: PropTypes.func,
    sendUpdateAssetAmount: PropTypes.func,
    sendUpdateGasPrice: PropTypes.func,
    sendUpdateNativeAmount: PropTypes.func,
    sendUpdateRecipient: PropTypes.func,
    sendUpdateSelected: PropTypes.func,
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

    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);

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
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
    this.props.sendClearFields();
  }
  keyboardDidShow(event) {
    // console.log('Keyboard Shown', event);
  }

  keyboardDidHide(event) {
    // console.log('Keyboard Hidden', event);
  }

  getTransactionSpeedOptions = () => {
    const { gasPrices } = this.props;

    const options = map(gasPrices, (value, key) => ({
      label: `${uppercase(key, 7)}: ${get(value, 'txFee.native.value.display')}  ~${get(value, 'estimatedTime.display')}`,
      value: key,
    }));

    options.unshift({ label: 'Cancel' });

    return options;
  }

  onResetAssetSelection = () => this.props.sendUpdateSelected('')

  onSelectAsset = symbol => () => this.props.sendUpdateSelected(symbol)

  onPressAssetHandler = (symbol) => () => this.props.sendUpdateSelected(symbol)

  onLongPressSend = () => {
    const { sendUpdateGasPrice } = this.props;

    this.setState({ isAuthorizing: true });

    console.log('onpresslongsend Props', this.props);

    if (isIphoneX()) {
      this.sendTransaction(this.handleAuthorizationComplete);
    } else {
      const options = this.getTransactionSpeedOptions();

      showActionSheetWithOptions({
        cancelButtonIndex: 0,
        options: options.map(option => option.label),
      }, (buttonIndex) => {
        if (buttonIndex > 0) {
          sendUpdateGasPrice(options[buttonIndex].value);

          this.sendTransaction(this.handleAuthorizationComplete);
        }
      });
    }
  }

  handleAuthorizationComplete = (helloLOl) => {
    console.log('callbackhelloLOl', helloLOl);
    this.setState({ isAuthorizing: false });
  }

  onPressTransactionSpeed = () => {
    const { sendUpdateGasPrice } = this.props;

    const options = this.getTransactionSpeedOptions();

    showActionSheetWithOptions({
      cancelButtonIndex: 0,
      options: options.map(option => option.label),
    }, (buttonIndex) => {
      if (buttonIndex > 0) {
        sendUpdateGasPrice(options[buttonIndex].value);
      }
    });
  }

  sendTransaction = (callback) => {
    const {
      assetAmount,
      navigation,
      onSubmit,
      sendClearFields,
    } = this.props;

    if (Number(assetAmount) <= 0) return false;

    console.log('sendTransaction callback', callback);

    return onSubmit().then(() => {
      console.log('supposedly hit the callback');
      callback();
      sendClearFields();
      navigation.navigate('ProfileScreen');
    });
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

  render() {
    const {
      isValidAddress,
      recipient,
      selected,
      sendUpdateRecipient,
    } = this.props;

    return (
      <KeyboardAvoidingView behavior="padding">
        <Column
          align="center"
          css={`
            background-color: ${colors.white};
            height: 100%;
          `}
        >
          <SendHeader
            isValid={isValidAddress}
            onChangeAddressInput={sendUpdateRecipient}
            recipient={recipient}
          />
          {!isValidAddress && <SendEmptyState onPressPaste={sendUpdateRecipient} />}
          {(isValidAddress && isEmpty(selected)) && (
            <SendAssetList
              allAssets={this.props.allAssets}
              fetchData={this.props.fetchData}
              onSelectAsset={this.onSelectAsset}
              uniqueTokens={this.props.uniqueTokens}
            />
          )}
          {(isValidAddress && !isEmpty(selected)) && (
            <SendAssetForm
              {...this.props}
              buttonRenderer={(
                <SendButton
                  {...this.props}
                  isAuthorizing={this.state.isAuthorizing}
                  onLongPress={this.onLongPressSend}
                />
              )}
              onChangeAssetAmount={this.onChangeAssetAmount}
              onChangeNativeAmount={this.onChangeNativeAmount}
              onResetAssetSelection={this.onResetAssetSelection}
              txSpeedRenderer={(
                isIphoneX() ? (
                  <SendTransactionSpeed
                    gasPrice={this.props.gasPrice}
                    nativeCurrencySymbol={this.props.nativeCurrencySymbol}
                    onPressTransactionSpeed={this.onPressTransactionSpeed}
                  />
                ) : null
              )}
            />
          )}
        </Column>
      </KeyboardAvoidingView>
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
