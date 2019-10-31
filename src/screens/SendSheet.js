import analytics from '@segment/analytics-react-native';
import {
  get,
  indexOf,
  isEmpty,
  isFunction,
  isString,
  map,
  property,
  sortBy,
  upperFirst,
  toLower,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
import { compose, withHandlers, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { Column } from '../components/layout';
import {
  SendAssetForm,
  SendAssetList,
  SendButton,
  SendContactList,
  SendHeader,
  SendTransactionSpeed,
} from '../components/send';
import {
  withAccountData,
  withAccountSettings,
  withDataInit,
  withTransitionProps,
  withUniqueTokens,
} from '../hoc';
import { borders, colors } from '../styles';
import { deviceUtils, isNewValueForPath } from '../utils';
import { showActionSheetWithOptions } from '../utils/actionsheet';
import { getLocalContacts } from '../handlers/localstorage/contacts';

const statusBarHeight = getStatusBarHeight(true);

const Container = styled(Column)`
  background-color: ${colors.transparent};
  height: 100%;
`;

const SheetContainer = styled(Column)`
  ${borders.buildRadius('top', 16)};
  background-color: ${colors.white};
  height: 100%;
  top: ${statusBarHeight};
`;

const formatGasSpeedItem = (value, key) => {
  const cost = get(value, 'txFee.native.value.display');
  const gwei = get(value, 'value.display');
  const time = get(value, 'estimatedTime.display');

  return {
    gweiValue: gwei,
    label: `${upperFirst(key)}: ${cost}   ~${time.slice(0, -1)}`,
    value: key,
  };
};

const labelOrder = ['slow', 'average', 'fast'];

const formatGasSpeedItems = gasPrices => {
  const gasItems = map(gasPrices, formatGasSpeedItem);
  return sortBy(gasItems, ({ value }) => indexOf(labelOrder, value));
};

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
    sendableUniqueTokens: PropTypes.arrayOf(PropTypes.object),
    sendClearFields: PropTypes.func,
    sendMaxBalance: PropTypes.func,
    sendUpdateAssetAmount: PropTypes.func,
    sendUpdateGasPrice: PropTypes.func,
    sendUpdateNativeAmount: PropTypes.func,
    sendUpdateRecipient: PropTypes.func,
    sendUpdateSelected: PropTypes.func,
  };

  static defaultProps = {
    isSufficientBalance: false,
    isSufficientGas: false,
    isValidAddress: false,
  };

  state = {
    contacts: [],
    currentInput: '',
    isAuthorizing: false,
  };

  componentDidMount = async () => {
    const { navigation, sendUpdateRecipient } = this.props;
    const address = get(navigation, 'state.params.address');

    if (address) {
      sendUpdateRecipient(address);
    }
    this.onUpdateContacts();
  };

  componentDidUpdate(prevProps, prevState) {
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
    const isNewValidAddress = isNewValueForPath(
      this.props,
      prevProps,
      'isValidAddress'
    );
    const isNewContactList = isNewValueForPath(
      this.state,
      prevState,
      'contacts'
    );

    if (isNewValidAddress || isNewSelected || isNewContactList) {
      let verticalGestureResponseDistance = 140;

      if (!isValidAddress && this.state.contacts.length !== 0) {
        verticalGestureResponseDistance = 140;
      } else if (isValidAddress) {
        verticalGestureResponseDistance = isEmpty(selected)
          ? 140
          : deviceUtils.dimensions.height;
      } else {
        verticalGestureResponseDistance = deviceUtils.dimensions.height;
      }

      navigation.setParams({ verticalGestureResponseDistance });
    }
  }

  componentWillUnmount() {
    this.props.sendClearFields();
  }

  onChangeAssetAmount = assetAmount => {
    if (isString(assetAmount)) {
      this.props.sendUpdateAssetAmount(assetAmount);
      analytics.track('Changed token input in Send flow');
    }
  };

  onChangeNativeAmount = nativeAmount => {
    if (isString(nativeAmount)) {
      this.props.sendUpdateNativeAmount(nativeAmount);
      analytics.track('Changed native currency input in Send flow');
    }
  };

  onLongPressSend = () => {
    this.setState({ isAuthorizing: true });

    if (isIphoneX()) {
      this.sendTransaction();
    } else {
      this.onPressTransactionSpeed(this.sendTransaction);
    }
  };

  onPressTransactionSpeed = onSuccess => {
    const { gasPrices, sendUpdateGasPrice } = this.props;

    const options = [{ label: 'Cancel' }, ...formatGasSpeedItems(gasPrices)];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 0,
        options: options.map(property('label')),
      },
      buttonIndex => {
        if (buttonIndex > 0) {
          const selectedGasPriceItem = options[buttonIndex];

          sendUpdateGasPrice(selectedGasPriceItem.value);
          analytics.track('Updated Gas Price', {
            gasPrice: selectedGasPriceItem.gweiValue,
          });
        }

        if (isFunction(onSuccess)) {
          onSuccess();
        }
      }
    );
  };

  onResetAssetSelection = () => {
    analytics.track('Reset asset selection in Send flow');
    this.props.sendUpdateSelected({});
  };

  onSelectAsset = asset => this.props.sendUpdateSelected(asset);

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

    return onSubmit()
      .then(() => {
        this.setState({ isAuthorizing: false });
        analytics.track('Sent transaction', {
          assetName: selected.name,
          assetType: selected.isNft ? 'unique_token' : 'token',
          isRecepientENS: toLower(recipient.slice(-4)) === '.eth',
        });
        sendClearFields();
        navigation.navigate('ProfileScreen');
      })
      .catch(() => {
        this.setState({ isAuthorizing: false });
      });
  };

  onUpdateContacts = async () => {
    const contacts = await getLocalContacts();
    this.setState({ contacts });
  };

  onChangeInput = event => {
    this.setState({ currentInput: event });
    this.props.sendUpdateRecipient(event);
  };

  render() {
    const {
      allAssets,
      fetchData,
      gasPrice,
      isValidAddress,
      nativeCurrencySymbol,
      recipient,
      selected,
      sendableUniqueTokens,
      sendUpdateRecipient,
      ...props
    } = this.props;
    const showEmptyState = !isValidAddress;
    const showAssetList = isValidAddress && isEmpty(selected);
    const showAssetForm = isValidAddress && !isEmpty(selected);

    return (
      <SheetContainer>
        <KeyboardAvoidingView behavior="padding">
          <Container align="center">
            <SendHeader
              contacts={this.state.contacts}
              isValid={isValidAddress}
              isValidAddress={isValidAddress}
              onChangeAddressInput={this.onChangeInput}
              onPressPaste={sendUpdateRecipient}
              onUpdateContacts={this.onUpdateContacts}
              recipient={recipient}
            />
            {showEmptyState && (
              <SendContactList
                allAssets={this.state.contacts}
                currentInput={this.state.currentInput}
                onPressContact={sendUpdateRecipient}
                onUpdateContacts={this.onUpdateContacts}
              />
            )}
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
                buttonRenderer={
                  <SendButton
                    {...props}
                    isAuthorizing={this.state.isAuthorizing}
                    onLongPress={this.onLongPressSend}
                  />
                }
                onChangeAssetAmount={this.onChangeAssetAmount}
                onChangeNativeAmount={this.onChangeNativeAmount}
                onResetAssetSelection={this.onResetAssetSelection}
                selected={selected}
                txSpeedRenderer={
                  isIphoneX() && (
                    <SendTransactionSpeed
                      gasPrice={gasPrice}
                      nativeCurrencySymbol={nativeCurrencySymbol}
                      onPressTransactionSpeed={this.onPressTransactionSpeed}
                    />
                  )
                }
              />
            )}
          </Container>
        </KeyboardAvoidingView>
      </SheetContainer>
    );
  }
}

export default compose(
  withAccountData,
  withUniqueTokens,
  withAccountSettings,
  withDataInit,
  withTransitionProps,
  withProps(({ transitionProps: { isTransitioning } }) => ({
    isTransitioning,
  })),
  withHandlers({
    fetchData: ({ refreshAccountData }) => async () => refreshAccountData(),
  })
)(SendSheet);
