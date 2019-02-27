import { get, isEmpty, map } from 'lodash';
import PropTypes from 'prop-types';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import React, { Component } from 'react';
import {
  Clipboard,
  Image,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  Text,
  View,
} from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { AssetList } from '../components/asset-list';
import { Button, HoldToAuthorizeButton } from '../components/buttons';
import { SendCoinRow } from '../components/coin-row';
import { AddressField, UnderlineField } from '../components/fields';
import { Icon } from '../components/icons';
import { PillLabel } from '../components/labels';
import {
  Column,
  Flex,
  FlyInView,
  Row,
} from '../components/layout';
import { SendEmptyState } from '../components/send';
import { ShadowStack } from '../components/shadow-stack';
import { Monospace } from '../components/text';
import { UniqueTokenRow } from '../components/unique-token';
import {
  withAccountRefresh,
  withAccountSettings,
} from '../hoc';
import { colors, fonts, padding } from '../styles';
import { deviceUtils, directionPropType } from '../utils';
import { showActionSheetWithOptions } from '../utils/actionsheet';
import { removeLeadingZeros, uppercase } from '../utils/formatters';

const DoubleArrowIconItem = ({ direction }) => (
  <Icon
    color={colors.dark}
    direction={direction}
    name="caret"
    size={5}
  />
);

DoubleArrowIconItem.propTypes = {
  direction: directionPropType,
};

const AddressInput = styled(AddressField)`
  padding-right: 20px;
`;

const AddressInputLabel = styled(Text)`
  color: ${colors.blueGreyDark};
  font-size: ${fonts.size.h5}
  font-family: ${fonts.family.SFProText};
  font-weight: ${fonts.weight.semibold};
  margin-right: 6px;
  opacity: 0.6;
`;

const AddressInputContainer = styled(Flex)`
  ${padding(20, 20)}
  align-items: center;
  width: 100%;
  overflow: hidden;
`;

const AddressInputBottomBorder = styled(View)`
  background-color: ${colors.blueGreyLight};
  opacity: 0.05;
  width: 100%;
  height: 2px;
`;

const Container = styled(Column)`
  background-color: ${colors.white};
  align-items: center;
  height: 100%;
`;

const HandleIcon = styled(Icon).attrs({
  color: colors.sendScreen.grey,
  name: 'handle',
})`
  margin-top: 16px;
`;

const NumberInput = styled(UnderlineField).attrs({
  keyboardType: 'decimal-pad',
})`
  margin-bottom: 10px;
  margin-right: 26px;
`;

const TransactionContainer = styled(View)`
  ${padding(20, 20)}
  padding-bottom: 50px;
  flex-grow: 2;
  background-color: ${colors.lightGrey};
`;

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
  };

  static defaultProps = {
    fetchData() {},
    isSufficientBalance: false,
    isSufficientGas: false,
    isValidAddress: false,
    sendClearFields() {},
    sendMaxBalance() {},
    sendUpdateAssetAmount() {},
    sendUpdateGasPrice() {},
    sendUpdateNativeAmount() {},
    sendUpdateRecipient() {},
    sendUpdateSelected() {},
  };

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

  getTransactionSpeedOptions = () => {
    const { gasPrices } = this.props;

    const options = map(gasPrices, (value, key) => ({
      label: `${uppercase(key, 7)}: ${get(value, 'txFee.native.value.display')}  ~${get(value, 'estimatedTime.display')}`,
      value: key,
    }));

    options.unshift({ label: 'Cancel' });

    return options;
  };

  formatNativeInput = (value = '') => {
    const { nativeCurrency } = this.props;
    const nativeCurrencyDecimals = (nativeCurrency !== 'ETH') ? 2 : 18;
    const formattedValue = removeLeadingZeros(value);
    const parts = formattedValue.split('.');
    const decimals = parts[1] || '';

    if (decimals.length > nativeCurrencyDecimals) {
      return `${parts[0]}.${decimals.substring(0, nativeCurrencyDecimals)}`;
    }

    return formattedValue;
  };

  onChangeAddressInput = (value) => {
    const { sendUpdateRecipient } = this.props;

    sendUpdateRecipient(value);
  };

  onPressPaste = () => {
    const { sendUpdateRecipient } = this.props;

    Clipboard.getString()
      .then((string) => {
        sendUpdateRecipient(string);
      });
  };

  onChangeAssetAmount = (value) => {
    const { sendUpdateAssetAmount } = this.props;

    sendUpdateAssetAmount(String(value));
  };

  onChangeNativeAmount = (value) => {
    const { sendUpdateNativeAmount } = this.props;

    sendUpdateNativeAmount(String(value));
  };

  onPressAssetHandler = (symbol) => {
    const { sendUpdateSelected } = this.props;

    return () => {
      sendUpdateSelected(symbol);
    };
  };

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
  };

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
  };

  onBackQRScanner = () => {
    InteractionManager.runAfterInteractions(() => {
      this.addressInput.focus();
    });
  };

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
  };

  renderAssetList() {
    const { allAssets, fetchData, uniqueTokens } = this.props;

    const sections = {
      balances: {
        data: allAssets,
        renderItem: (itemProps) => (
          <SendCoinRow
            {...itemProps}
            onPress={this.onPressAssetHandler(itemProps.item.symbol)}
          />
        ),
      },
      collectibles: {
        data: uniqueTokens,
        renderItem: UniqueTokenRow,
      },
    };

    return (
      <FlyInView style={{ flex: 1 }}>
        <AssetList
          fetchData={fetchData}
          hideHeader
          sections={[sections.balances]}
        />
      </FlyInView>
    );
  }

  renderSendButton() {
    const { assetAmount, isSufficientBalance, isSufficientGas } = this.props;

    const isZeroAssetAmount = Number(assetAmount) <= 0;

    let disabled = true;
    let label = 'Enter an Amount';

    if (!isZeroAssetAmount && !isSufficientGas) {
      disabled = true;
      label = 'Insufficient Gas';
    } else if (!isZeroAssetAmount && !isSufficientBalance) {
      disabled = true;
      label = 'Insufficient Funds';
    } else if (!isZeroAssetAmount) {
      disabled = false;
      label = 'Hold to Send';
    }

    return (
      <HoldToAuthorizeButton
        disabled={disabled}
        onLongPress={this.onLongPressSend}
        isAuthorizing={this.state.isAuthorizing}
      >
        {label}
      </HoldToAuthorizeButton>
    );
  }

  renderTransactionSpeed() {
    const { gasPrice, nativeCurrencySymbol } = this.props;

    const fee = get(gasPrice, 'txFee.native.value.display', `${nativeCurrencySymbol}0.00`);
    const time = get(gasPrice, 'estimatedTime.display', '');

    return (
      <Row justify="space-between">
        <PillLabel>Fee: {fee}</PillLabel>
        <PillLabel
          color={colors.blueGreyDark}
          icon="clock"
          onPress={this.onPressTransactionSpeed}
        >
          Arrives in ~ {time}
        </PillLabel>
      </Row>
    );
  }

  renderTransaction() {
    const {
      allAssets,
      assetAmount,
      nativeAmount,
      nativeCurrency,
      selected,
      sendMaxBalance,
    } = this.props;
    const selectedAsset = allAssets.find(asset => asset.symbol === selected.symbol);

    const symbolMaxLength = 6;
    const selectedAssetSymbol = (selected.symbol.length > symbolMaxLength)
      ? selected.symbol.substring(0, symbolMaxLength)
      : selected.symbol;

    return (
      <Column flex={1}>
        <ShadowStack
          borderRadius={0}
          height={64}
          shadows={[
            [0, 4, 6, colors.purple, 0.12],
            [0, 6, 4, colors.purple, 0.24],
          ]}
          shouldRasterizeIOS={true}
          width={deviceUtils.dimensions.width}
        >
          <SendCoinRow
            item={selectedAsset}
            onPress={this.onPressAssetHandler('')}
            paddingRight={24}
          >
            <Column>
              <DoubleArrowIconItem direction="up" />
              <DoubleArrowIconItem direction="down" />
            </Column>
          </SendCoinRow>
        </ShadowStack>
        <TransactionContainer>
          <Column>
            <Row justify="space-between">
              <NumberInput
                autoFocus
                buttonText="Max"
                format={removeLeadingZeros}
                onChange={this.onChangeAssetAmount}
                onPressButton={sendMaxBalance}
                placeholder="0"
                value={assetAmount}
              />
              <Monospace color="blueGreyDark" size="h2">
                {selectedAssetSymbol}
              </Monospace>
            </Row>
            <Row justify="space-between">
              <NumberInput
                buttonText="Max"
                format={this.formatNativeInput}
                onChange={this.onChangeNativeAmount}
                onPressButton={sendMaxBalance}
                placeholder="0.00"
                value={nativeAmount}
              />
              <Monospace color="blueGreyDark" size="h2">
                {nativeCurrency}
              </Monospace>
            </Row>
          </Column>
          {this.renderSendButton()}
          {isIphoneX() ? this.renderTransactionSpeed() : null}
        </TransactionContainer>
      </Column>
    );
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
        <Container>
          <HandleIcon />
          <AddressInputContainer>
            <AddressInputLabel>To:</AddressInputLabel>
            <AddressInput
              autoFocus
              isValid={isValidAddress}
              onChange={this.onChangeAddressInput}
              placeholder="Ethereum Address: (0x...)"
              value={recipient}
              inputRef={(addressInput) => { this.addressInput = addressInput; }}
            />
          </AddressInputContainer>
          <AddressInputBottomBorder />
          {!isValidAddress && <SendEmptyState onPressPaste={sendUpdateRecipient} />}
          {isValidAddress && isEmpty(selected) ? this.renderAssetList() : null}
          {isValidAddress && !isEmpty(selected) ? this.renderTransaction() : null}
        </Container>
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
