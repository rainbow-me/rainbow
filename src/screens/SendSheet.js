import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Keyboard, KeyboardAvoidingView } from 'react-native';
import { getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
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
import { borders, colors } from '../styles';
import { deviceUtils, isNewValueForPath } from '../utils';

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

export default class SendSheet extends Component {
  static propTypes = {
    allAssets: PropTypes.array,
    assetAmount: PropTypes.string,
    contacts: PropTypes.object,
    currentInput: PropTypes.string,
    fetchData: PropTypes.func,
    gasPrices: PropTypes.object,
    isAuthorizing: PropTypes.bool,
    isSufficientBalance: PropTypes.bool,
    isSufficientGas: PropTypes.bool,
    isValidAddress: PropTypes.bool,
    nativeCurrencySymbol: PropTypes.string,
    navigation: PropTypes.object,
    onChangeAssetAmount: PropTypes.func,
    onChangeInput: PropTypes.func,
    onChangeNativeAmount: PropTypes.func,
    onLongPressSend: PropTypes.func,
    onPressTransactionSpeed: PropTypes.func,
    onResetAssetSelection: PropTypes.func,
    onSelectAsset: PropTypes.func,
    recipient: PropTypes.string,
    removeContact: PropTypes.func,
    selected: PropTypes.object,
    selectedGasPrice: PropTypes.object,
    sendableUniqueTokens: PropTypes.arrayOf(PropTypes.object),
    sendMaxBalance: PropTypes.func,
    sendUpdateRecipient: PropTypes.func,
    sortedContacts: PropTypes.array,
  };

  componentDidUpdate(prevProps) {
    const { contacts, isValidAddress, navigation, selected } = this.props;

    if (isValidAddress && !prevProps.isValidAddress) {
      Keyboard.dismiss();
    }

    const isNewSelected = isNewValueForPath(this.props, prevProps, 'selected');
    const isNewValidAddress = isNewValueForPath(
      this.props,
      prevProps,
      'isValidAddress'
    );
    const isNewContactList = isNewValueForPath(
      this.props,
      prevProps,
      'contacts'
    );

    if (isNewValidAddress || isNewSelected || isNewContactList) {
      let verticalGestureResponseDistance = 140;

      if (!isValidAddress && !isEmpty(contacts)) {
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

  render() {
    const {
      allAssets,
      contacts,
      currentInput,
      fetchData,
      isAuthorizing,
      isSufficientBalance,
      isSufficientGas,
      isValidAddress,
      nativeCurrencySymbol,
      onChangeAssetAmount,
      onChangeInput,
      onChangeNativeAmount,
      onLongPressSend,
      onPressTransactionSpeed,
      onResetAssetSelection,
      onSelectAsset,
      recipient,
      removeContact,
      selected,
      selectedGasPrice,
      sendMaxBalance,
      sendableUniqueTokens,
      sendUpdateRecipient,
      sortedContacts,
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
              contacts={contacts}
              isValidAddress={isValidAddress}
              onChangeAddressInput={onChangeInput}
              onPressPaste={sendUpdateRecipient}
              recipient={recipient}
              removeContact={removeContact}
            />
            {showEmptyState && (
              <SendContactList
                allAssets={sortedContacts}
                currentInput={currentInput}
                onPressContact={sendUpdateRecipient}
                removeContact={removeContact}
              />
            )}
            {showAssetList && (
              <SendAssetList
                allAssets={allAssets}
                fetchData={fetchData}
                onSelectAsset={onSelectAsset}
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
                    isAuthorizing={isAuthorizing}
                    isSufficientBalance={isSufficientBalance}
                    isSufficientGas={isSufficientGas}
                    onLongPress={onLongPressSend}
                  />
                }
                onChangeAssetAmount={onChangeAssetAmount}
                onChangeNativeAmount={onChangeNativeAmount}
                onResetAssetSelection={onResetAssetSelection}
                selected={selected}
                sendMaxBalance={sendMaxBalance}
                txSpeedRenderer={
                  isIphoneX() && (
                    <SendTransactionSpeed
                      gasPrice={selectedGasPrice}
                      nativeCurrencySymbol={nativeCurrencySymbol}
                      onPressTransactionSpeed={onPressTransactionSpeed}
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
