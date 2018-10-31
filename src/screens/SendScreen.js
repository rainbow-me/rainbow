import _ from 'underscore';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import TouchID from 'react-native-touch-id';
import { Animated, Clipboard, Image, Keyboard, KeyboardAvoidingView, StatusBar, Text, View, InteractionManager } from 'react-native';
import { compose, withHandlers } from 'recompact';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { withSafeTimeout } from '@hocs/safe-timers';
import { isIphoneX } from 'react-native-iphone-x-helper';

import { showActionSheetWithOptions } from '../utils/actionsheet';
import { AddressField, UnderlineField } from '../components/fields';
import { AssetList, UniqueTokenRow } from '../components/asset-list';
import { Button, BlockButton, LongPressButton } from '../components/buttons';
import { colors, fonts, padding, shadow } from '../styles';
import { Column, Flex, FlyInView, Row } from '../components/layout';
import { formatUSD, formatUSDInput, removeLeadingZeros, uppercase } from '../utils/formatters';
import { Monospace } from '../components/text';
import { PillLabel } from '../components/labels';
import { SendCoinRow } from '../components/coin-row';
import { Icon } from '../components/icons';
import { ShadowStack } from '../components/shadow-stack';
import {
  withAccountAddress,
  withAccountAssets,
  withRequestsInit,
} from '../hoc';
import { deviceUtils } from '../utils';

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

const BackgroundImage = styled(Image)`
  height: 88px;
  width: 91px;
`;

const BackgroundImageContainer = styled(Row)`
  flex-grow: 1;
  justify-content: center;
  align-items: center;
`;

const BottomButton = styled(Button).attrs({
  type: 'pill',
})`
  ${padding(0, 10)}
  background-color: ${colors.sendScreen.brightBlue};
  align-items: center;
  justify-content: center;
  height: 30px;
  margin-left: 10px;
`;

const BottomButtonContainer = styled(Flex)`
  ${padding(20, 20)}
  padding-top: 0px;
  justify-content: flex-end;
  width: 100%;
`;

const CameraIcon = styled(Icon).attrs({
  name: 'camera',
  color: colors.white,
  width: 17,
  height: 14,
})`
  margin-top: -5px;
`;

const Container = styled(Column)`
  background-color: ${colors.white};
  align-items: center;
  height: 100%;
`;

const EmptyStateContainer = styled(Column)`
  background-color: ${colors.white};
  padding-bottom: ${isIphoneX() ? '50px' : '15px'};
  justify-content: space-between;
  flex: 1;
`;

const HandleIcon = styled(Icon).attrs({
  name: 'handle',
  color: colors.sendScreen.grey,
})`
  margin-top: 16px;
`;

const NumberInput = styled(UnderlineField).attrs({
  keyboardType: 'decimal-pad',
})`
  margin-bottom: 10px;
  margin-right: 26px;
`;

const NumberInputLabel = styled(Monospace)`
  fontSize: ${fonts.size.h2};
  color: ${colors.blueGreyDark};
`;

const SendButton = styled(BlockButton).attrs({ component: LongPressButton })`
  ${padding(18, 0)}
`;

const TransactionContainer = styled(View)`
  ${padding(20, 20)}
  padding-bottom: 50px;
  flex-grow: 2;
  background-color: ${colors.lightGrey};
`;

class SendScreen extends Component {
  static propTypes = {
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

  constructor(props) {
    super(props);

    this.state = {
      biometryType: null,
      sendLongPressProgress: new Animated.Value(0),
    };
  }

  componentDidMount(prevProps) {
    const { navigation, sendUpdateRecipient } = this.props;
    const address = get(navigation, 'state.params.address');

    if (address) {
      sendUpdateRecipient(address);
    }

    StatusBar.setBarStyle('light-content', true);

    TouchID.isSupported()
      .then(biometryType => {
        this.setState({ biometryType });
      })
      .catch(() => {
        this.setState({ biometryType: 'FaceID' });
      });
  }

  componentDidUpdate(prevProps) {
    const { isValidAddress } = this.props;
    if (isValidAddress && (prevProps.isValidAddress !== isValidAddress)) {
      Keyboard.dismiss();
    }
  }

  componentWillUnmount() {
    const { sendClearFields } = this.props;

    StatusBar.setBarStyle('dark-content', true);

    sendClearFields();
  }

  getTransactionSpeedOptions = () => {
    const { gasPrices } = this.props;

    const options = _.map(gasPrices, (value, key) => ({
      value: key,
      label: `${uppercase(key, 7)}: ${get(value, 'txFee.native.value.display')}  ~${get(value, 'estimatedTime.display')}`,
    }));

    options.unshift({ label: 'Cancel' });

    return options;
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

  onPressSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      toValue: 100,
      duration: 800,
    }).start();
  };

  onReleaseSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      toValue: 0,
      duration: (sendLongPressProgress._value / 100) * 800,
    }).start();
  };

  onLongPressSend = () => {
    const { sendUpdateGasPrice } = this.props;
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      toValue: 0,
      duration: (sendLongPressProgress._value / 100) * 800,
    }).start();

    if (isIphoneX()) {
      this.sendTransaction();
    } else {
      const options = this.getTransactionSpeedOptions();

      showActionSheetWithOptions({
        options: options.map(option => option.label),
        cancelButtonIndex: 0,
      }, (buttonIndex) => {
        if (buttonIndex > 0) {
          sendUpdateGasPrice(options[buttonIndex].value);

          this.sendTransaction();
        }
      });
    }
  };

  onPressTransactionSpeed = () => {
    const { sendUpdateGasPrice } = this.props;

    const options = this.getTransactionSpeedOptions();

    showActionSheetWithOptions({
      options: options.map(option => option.label),
      cancelButtonIndex: 0,
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

  onPressCamera = () => {
    const { navigation } = this.props;

    Keyboard.dismiss();

    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('SendQRScannerScreen', { onSuccess: this.onChangeAddressInput, onBack: this.onBackQRScanner });
    });
  };

  sendTransaction = () => {
    const {
      assetAmount,
      navigation,
      onSubmit,
      sendClearFields,
    } = this.props;

    if (Number(assetAmount) > 0) {
      onSubmit()
        .then(() => {
          sendClearFields();
          navigation.replace('ActivityScreen');
        });
    }
  };

  renderAssetList() {
    const { accountInfo, fetchData, uniqueTokens } = this.props;

    const sections = {
      balances: {
        data: accountInfo.assets,
        renderItem: (props) => (
          <SendCoinRow
            {...props}
            onPress={this.onPressAssetHandler(props.item.symbol)}
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

  renderEmptyState() {
    return (
      <EmptyStateContainer>
        <BackgroundImageContainer>
          <BackgroundImage source={require('../assets/send-background.png')} />
        </BackgroundImageContainer>
        <BottomButtonContainer>
          <BottomButton onPress={this.onPressPaste}>Paste</BottomButton>
          <BottomButton onPress={this.onPressCamera}><CameraIcon /></BottomButton>
        </BottomButtonContainer>
      </EmptyStateContainer>
    );
  }

  renderSendButton() {
    const { assetAmount, isSufficientBalance, isSufficientGas } = this.props;
    const { biometryType, sendLongPressProgress } = this.state;

    const isZeroAssetAmount = Number(assetAmount) <= 0;
    const leftIconName = biometryType === 'FaceID' ? 'faceid' : 'touchid';

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
      <SendButton
        disabled={disabled}
        leftIconName={disabled ? null : leftIconName}
        rightIconName={disabled ? null : 'progress'}
        rightIconProps={{ progress: sendLongPressProgress, color: colors.alpha(colors.sendScreen.grey, 0.3), progressColor: colors.white }}
        onLongPress={this.onLongPressSend}
        onPress={this.onPressSend}
        onRelease={this.onReleaseSend}
      >
        {label}
      </SendButton>
    );
  }

  renderTransactionSpeed() {
    const { gasPrice } = this.props;

    const fee = get(gasPrice, 'txFee.native.value.display', '$0.00').substring(1);
    const time = get(gasPrice, 'estimatedTime.display', '');

    return (
      <Row justify="space-between">
        <PillLabel>Fee: ${formatUSD(fee)}</PillLabel>
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
      assetAmount,
      nativeAmount,
      selected,
      sendMaxBalance,
    } = this.props;

    return (
      <Column flex={1}>
        <ShadowStack
          borderRadius={0}
          height={64}
          shadows={[
            shadow.buildString(0, 4, 6, colors.alpha(colors.purple, 0.12)),
            shadow.buildString(0, 6, 4, colors.alpha(colors.purple, 0.24)),
          ]}
          shouldRasterizeIOS={true}
          width={deviceUtils.dimensions.width}
        >
          <SendCoinRow item={selected} onPress={this.onPressAssetHandler('')}>
            <Column>
              <Icon name="caret" direction="up" size={5} color={colors.dark} />
              <Icon name="caret" direction="down" size={5} color={colors.dark} />
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
              <NumberInputLabel>{selected.symbol}</NumberInputLabel>
            </Row>
            <Row justify="space-between">
              <NumberInput
                buttonText="Max"
                format={formatUSDInput}
                onChange={this.onChangeNativeAmount}
                onPressButton={sendMaxBalance}
                placeholder="0.00"
                value={nativeAmount}
              />
              <NumberInputLabel>USD</NumberInputLabel>
            </Row>
          </Column>
          {this.renderSendButton()}
          {isIphoneX() ? this.renderTransactionSpeed() : null}
        </TransactionContainer>
      </Column>
    );
  }

  render() {
    const { isValidAddress, recipient, selected } = this.props;

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
          {!isValidAddress ? this.renderEmptyState() : null}
          {isValidAddress && _.isEmpty(selected) ? this.renderAssetList() : null}
          {isValidAddress && !_.isEmpty(selected) ? this.renderTransaction() : null}
        </Container>
      </KeyboardAvoidingView>
    );
  }
}

const reduxProps = ({ account }) => ({
  accountInfo: account.accountInfo,
  fetching: account.fetching,
  fetchingUniqueTokens: account.fetchingUniqueTokens,
  uniqueTokens: account.uniqueTokens,
});

export default compose(
  withAccountAddress,
  withAccountAssets,
  withRequestsInit,
  withSafeTimeout,
  withHandlers({
    fetchData: ({
      accountAddress,
      accountUpdateAccountAddress,
      setSafeTimeout,
      transactionsToApproveInit,
    }) => () => {
      accountUpdateAccountAddress(accountAddress, 'BALANCEWALLET');
      transactionsToApproveInit();
      // hack: use timeout so that it looks like loading is happening
      // accountUpdateAccountAddress does not return a promise
      return new Promise(resolve => setSafeTimeout(resolve, 2000));
    },
  }),
  connect(reduxProps, null),
)(SendScreen);
