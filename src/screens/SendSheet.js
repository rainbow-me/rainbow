import analytics from '@segment/analytics-react-native';
import {
  get,
  isEmpty,
  isFunction,
  isString,
  property,
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
import {
  withAccountData,
  withAccountSettings,
  withDataInit,
  withUniqueTokens,
} from '../hoc';
import { colors } from '../styles';
import { deviceUtils, gasUtils, isNewValueForPath } from '../utils';
import { showActionSheetWithOptions } from '../utils/actionsheet';

const Container = styled(Column)`
  background-color: ${colors.white};
  height: 100%;
`;

class SendSheet extends Component {
  static propTypes = {
    allAssets: PropTypes.array,
    assetAmount: PropTypes.string,
    fetchData: PropTypes.func,
    gasPrices: PropTypes.object,
    gasUpdateGasPrice: PropTypes.func,
    isSufficientBalance: PropTypes.bool,
    isSufficientGas: PropTypes.bool,
    isValidAddress: PropTypes.bool,
    nativeCurrencySymbol: PropTypes.string,
    navigation: PropTypes.object,
    onSubmit: PropTypes.func,
    recipient: PropTypes.string,
    selected: PropTypes.object,
    selectedGasPrice: PropTypes.object,
    sendableUniqueTokens: PropTypes.arrayOf(PropTypes.object),
    sendClearFields: PropTypes.func,
    sendMaxBalance: PropTypes.func,
    sendUpdateAssetAmount: PropTypes.func,
    sendUpdateNativeAmount: PropTypes.func,
    sendUpdateRecipient: PropTypes.func,
    sendUpdateSelected: PropTypes.func,
    txFees: PropTypes.object,
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

    const isNewSelected = isNewValueForPath(this.props, prevProps, 'selected');
    const isNewValidAddress = isNewValueForPath(this.props, prevProps, 'isValidAddress');

    if (isNewValidAddress || isNewSelected) {
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
      analytics.track('Changed token input in Send flow');
    }
  }

  onChangeNativeAmount = (nativeAmount) => {
    if (isString(nativeAmount)) {
      this.props.sendUpdateNativeAmount(nativeAmount);
      analytics.track('Changed native currency input in Send flow');
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

  onPressTransactionSpeed = (onSuccess) => {
    const {
      gasPrices,
      gasUpdateGasPrice,
      txFees,
    } = this.props;

    const options = [
      { label: 'Cancel' },
      ...gasUtils.formatGasSpeedItems(gasPrices, txFees),
    ];

    showActionSheetWithOptions({
      cancelButtonIndex: 0,
      options: options.map(property('label')),
    }, (buttonIndex) => {
      if (buttonIndex > 0) {
        const selectedGasPriceItem = options[buttonIndex];

        gasUpdateGasPrice(selectedGasPriceItem.value);
        analytics.track('Updated Gas Price', { gasPrice: selectedGasPriceItem.gweiValue });
      }

      if (isFunction(onSuccess)) {
        onSuccess();
      }
    });
  }

  onResetAssetSelection = () => {
    analytics.track('Reset asset selection in Send flow');
    this.props.sendUpdateSelected({});
  }

  onSelectAsset = asset => this.props.sendUpdateSelected(asset)

  sendTransaction = () => {
    const {
      assetAmount,
      navigation,
      onSubmit,
      recipient,
      selected,
      sendClearFields,
    } = this.props;

    if (Number(assetAmount) <= 0) return false;

    return onSubmit().then(() => {
      this.setState({ isAuthorizing: false });
      analytics.track('Sent transaction', {
        assetName: selected.name,
        assetType: selected.isNft ? 'unique_token' : 'token',
        isRecepientENS: recipient.slice(-4).toLowerCase() === '.eth',
      });
      sendClearFields();
      navigation.navigate('ProfileScreen');
    }).catch(error => {
      this.setState({ isAuthorizing: false });
    });
  }

  render() {
    const {
      allAssets,
      fetchData,
      isValidAddress,
      nativeCurrencySymbol,
      recipient,
      selected,
      selectedGasPrice,
      sendableUniqueTokens,
      sendUpdateRecipient,
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
                uniqueTokens={sendableUniqueTokens}
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
                      gasPrice={selectedGasPrice}
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
  withAccountData,
  withUniqueTokens,
  withAccountSettings,
  withDataInit,
  withHandlers({
    fetchData: ({ refreshAccountData }) => async () => refreshAccountData(),
  }),
)(SendSheet);
