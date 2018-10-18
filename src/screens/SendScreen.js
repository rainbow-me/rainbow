import _ from 'underscore';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import { Animated, Clipboard, Image, Keyboard, KeyboardAvoidingView, StatusBar, Text, View } from 'react-native';
import { compose, withHandlers } from 'recompact';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { withSafeTimeout } from '@hocs/safe-timers';

import { showActionSheetWithOptions } from '../utils/actionsheet';
import { AddressField, UnderlineField } from '../components/fields';
import { AssetList, UniqueTokenRow } from '../components/asset-list';
import { Button, BlockButton, LongPressButton } from '../components/buttons';
import { colors, fonts, padding, position, shadow } from '../styles';
import { Column, Page, Flex, FlexItem, FlyInView, Row } from '../components/layout';
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

console.disableYellowBox = true;

const AddressInputLabel = styled(Text)`
  color: ${colors.blueGreyDark};
  font-size: ${fonts.size.h5}
  font-family: ${fonts.family.SFMono};
  font-weight: ${fonts.weight.semibold};
  margin-right: 6px;
  opacity: 0.6;
`;

const AddressInputContainer = styled(Flex)`
  ${padding(20, 20)}
  padding-bottom: 20px;
  align-items: center;
`;

const AddressInputBottomBorder = styled(View)`
  background-color: ${colors.blueGreyLight};
  opacity: 0.05;
  width: 100%;
  height: 2px;
`;

const AssetContainer = styled(Flex)`
  ${position.size('100%')}
`;

const BackgroundImage = styled(Image)`
  height: 88px;
  width: 91px;
`;

const BackgroundImageContainer = styled(Flex)`
  flex-grow: 1;
  justify-content: center;
  align-items: center;
`;

const BottomButton = styled(Button)`
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

const CameraIcon = styled(Image)`
  margin-top: -5px;
  height: 14px;
  width: 17px;
`;

const Container = styled(Page)`
  background-color: ${colors.white};
  align-items: center;
  flex-grow: 1;
  padding-top: 5px;
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
  flex-grow: 1;
  background-color: ${colors.lightGrey};
`;

const HandleIcon = styled(Icon).attrs({
  name: 'caret',
  color: colors.sendScreen.grey,
})`
  transform: rotate(90deg) scaleX(1.75);
`;

class SendScreen extends Component {
  static propTypes = {
    fetchData: PropTypes.func,
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
      sendLongPressProgress: new Animated.Value(0),
    };
  }

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
  }

  componentWillUnmount() {
    StatusBar.setBarStyle('dark-content', true);
  }

  onChangeAddressInput = (value) => {
    const { sendUpdateRecipient } = this.props;

    sendUpdateRecipient(value);
  };

  onPressPaste = () => {
    const { sendUpdateRecipient } = this.props;

    Clipboard.getString()
      .then((string) => {
        sendUpdateRecipient(string);

        Keyboard.dismiss();
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
    const {
      assetAmount,
      onSubmit,
      navigation,
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

  onPressTransactionSpeed = () => {
    const { gasPrices, sendUpdateGasPrice } = this.props;

    const options = _.map(gasPrices, (value, key) => ({
      value: key,
      label: `${uppercase(key, 7)}: ${get(value, 'txFee.native.value.display')}  ~${get(value, 'estimatedTime.display')}`,
    }));

    options.unshift({ label: 'Cancel' });

    showActionSheetWithOptions({
      options: options.map(option => option.label),
      cancelButtonIndex: 0,
    }, (buttonIndex) => {
      if (buttonIndex > 0) {
        sendUpdateGasPrice(options[buttonIndex].value);
      }
    });
  };

  onPressCamera = () => {
    const { navigation } = this.props;

    navigation.navigate('QRScannerScreen');
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
      <FlyInView>
        <AssetList
          fetchData={fetchData}
          hideHeader
          sections={[sections.balances]}
        />
      </FlyInView>
    );
  }

  renderAssets() {
    const { selected } = this.props;

    return (
      <AssetContainer>
        {_.isEmpty(selected) ? this.renderAssetList() : this.renderTransaction()}
      </AssetContainer>
    );
  }

  renderEmptyState() {
    return (
      <FlexItem>
        <BackgroundImageContainer>
          <BackgroundImage source={require('../assets/send-background.png')} />
        </BackgroundImageContainer>
        <BottomButtonContainer>
          <BottomButton onPress={this.onPressPaste}>Paste</BottomButton>
          <BottomButton onPress={this.onPressCamera}><CameraIcon source={require('../assets/camera.png')} /></BottomButton>
        </BottomButtonContainer>
      </FlexItem>
    );
  }

  renderTransaction() {
    const {
      gasPrice,
      assetAmount,
      nativeAmount,
      sendMaxBalance,
      selected,
    } = this.props;

    const { sendLongPressProgress } = this.state;

    const fee = get(gasPrice, 'txFee.native.value.display', '$0.00').substring(1);
    const time = get(gasPrice, 'estimatedTime.display', '');
    const isZeroAssetAmount = Number(assetAmount) <= 0;

    return (
      <Column flex={1}>
        <ShadowStack
          height={64}
          width={deviceUtils.dimensions.width}
          borderRadius={0}
          shadows={[
            shadow.buildString(0, 4, 6, colors.alpha(colors.purple, 0.12)),
            shadow.buildString(0, 6, 4, colors.alpha(colors.purple, 0.24)),
          ]}
          shouldRasterizeIOS={true}
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
            <Row>
              <NumberInput
                autoFocus
                format={removeLeadingZeros}
                placeholder="0"
                onChange={this.onChangeAssetAmount}
                value={assetAmount}
              />
              <NumberInputLabel>{selected.symbol}</NumberInputLabel>
            </Row>
            <Row>
              <NumberInput
                buttonText="Max"
                format={formatUSDInput}
                onChange={this.onChangeNativeAmount}
                onPressButton={sendMaxBalance}
                placeholder="0.00"
                value={nativeAmount && formatUSD(nativeAmount)}
              />
              <NumberInputLabel>USD</NumberInputLabel>
            </Row>
          </Column>
          <SendButton
            disabled={isZeroAssetAmount}
            leftIconName={isZeroAssetAmount ? null : 'face'}
            rightIconName={isZeroAssetAmount ? null : 'progress'}
            rightIconProps={{ progress: sendLongPressProgress, color: colors.alpha(colors.sendScreen.grey, 0.3), progressColor: colors.white }}
            onLongPress={this.onLongPressSend}
            onPress={this.onPressSend}
            onRelease={this.onReleaseSend}
          >{isZeroAssetAmount ? 'Enter An Amount' : 'Hold To Send'}</SendButton>
          <Row justify="space-between">
            <PillLabel>Fee: ${formatUSD(fee)}</PillLabel>
            <PillLabel icon="clock" onPress={this.onPressTransactionSpeed}>Arrives in ~ {time}</PillLabel>
          </Row>
        </TransactionContainer>
      </Column>
    );
  }

  render() {
    const { recipient, isValidAddress } = this.props;

    return (
      <KeyboardAvoidingView behavior="padding">
        <Container showBottomInset>
          <HandleIcon />
          <AddressInputContainer>
            <AddressInputLabel>To:</AddressInputLabel>
            <AddressField
              autoFocus
              isValid={isValidAddress}
              onChange={this.onChangeAddressInput}
              placeholder="Ethereum Address: (0x...)"
              value={recipient}
            />
          </AddressInputContainer>
          <AddressInputBottomBorder />
          {isValidAddress ? this.renderAssets() : this.renderEmptyState()}
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

