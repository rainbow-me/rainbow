import _ from 'underscore';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import { Animated, Clipboard, Image, KeyboardAvoidingView, Text, View } from 'react-native';
import { compose } from 'recompact';
import { connect } from 'react-redux';
import { get } from 'lodash';

import { AssetList, UniqueTokenRow } from '../components/asset-list';
import { Button, BlockButton } from '../components/buttons';
import { colors, fonts, padding, position } from '../styles';
import { Monospace } from '../components/text';
import { Column, Page, Flex, FlexItem, FlyInView, Row } from '../components/layout';
import { SendCoinRow } from '../components/coin-row';
import { AddressField, UnderlineField } from '../components/fields';
import { PillLabel } from '../components/labels';
import { formatUSD, formatUSDInput, removeLeadingZeros } from '../utils/formatters';

const AddressInputLabel = styled(Text)`
  color: ${colors.blueGreyDark};
  font-size: ${fonts.size.h5}
  font-family: ${fonts.family.SFMono};
  font-weight: ${fonts.weight.semibold};
  margin-right: 6px;
  opacity: 0.6;
`;

const AddressInputContainer = styled(Flex)`
  ${padding(45, 20)}
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
  margin-top: 130px;
`;

const BackgroundImageContainer = styled(Flex)`
  flex-grow: 1;
  justify-content: center;
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
  justify-content: flex-end;
  width: 100%;
`;

const Container = styled(Page)`
  background-color: ${colors.white};
  align-items: center;
  flex-grow: 1;
`;

const NumberInput = styled(UnderlineField).attrs({ keyboardType: 'number-pad' })`
  margin-bottom: 15px;
  margin-right: 30px;
`;

const NumberInputLabel = styled(Monospace)`
  fontSize: ${fonts.size.h2};
  color: ${colors.blueGreyDark};
`;

const SendButton = styled(BlockButton)`
  margin-top: 15px;
  margin-bottom: 30px;
`;

const TransactionContainer = styled(View)`
  ${padding(20, 20)}
  flex-grow: 1;
  background-color: ${colors.lightGrey};
`;

class SendScreen extends Component {
  static propTypes = {
    isValidAddress: PropTypes.bool,
    selected: PropTypes.string,
    sendMaxBalance: PropTypes.func,
    sendUpdateAssetAmount: PropTypes.func,
    sendUpdateNativeAmount: PropTypes.func,
    sendUpdateRecipient: PropTypes.func,
    sendUpdateSelected: PropTypes.func,
  };

  static defaultProps = {
    isValidAddress: false,
    sendMaxBalance() {},
    sendUpdateAssetAmount() {},
    sendUpdateNativeAmount() {},
    sendUpdateRecipient() {},
    sendUpdateSelected() {},
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedAsset: {},
      selectedAssetAnimation: new Animated.Value(1),
      selectedAssetPageY: 0,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      selectedAsset,
      selectedAssetAnimation,
    } = this.state;

    if (_.isEmpty(prevState.selectedAsset) && !_.isEmpty(selectedAsset)) {
      Animated.timing(selectedAssetAnimation, { toValue: 0, duration: 300 }).start();
    }
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

  onPressAssetHandler = (selectedAsset) => {
    const { sendUpdateSelected } = this.props;

    return () => {
      this.setState({ selectedAsset });

      sendUpdateSelected(selectedAsset.symbol);
    };
  };

  onPressSend = () => {
    const { onSubmit } = this.props;

    this.setState({ isLoading: true }, () => {
      onSubmit();
    });
  };

  renderAssetList() {
    const { accountInfo, uniqueTokens } = this.props;
    const { selectedAsset } = this.state;

    const sections = {
      balances: {
        data: accountInfo.assets,
        renderItem: (props) => (
          <SendCoinRow
            {...props}
            isSelected={props.item.name === selectedAsset.name}
            onPress={this.onPressAssetHandler(props.item)}
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
        <AssetList sections={[sections.balances]} hideHeader />
      </FlyInView>
    );
  }

  renderAssets() {
    const { selected } = this.props;

    console.log('selected', selected)

    return (
      <AssetContainer>
        {selected ? null : this.renderAssetList()}
        {selected ? this.renderTransaction() : null}
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
    } = this.props;

    const { selectedAsset } = this.state;

    const fee = get(gasPrice, 'txFee.native.value.display', '$0.00').substring(1);
    const time = get(gasPrice, 'estimatedTime.display', '');
    const isZeroAssetAmount = Number(assetAmount) <= 0;

    return (
      <Column flex={1} style={{
        // top: selectedAssetAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, selectedAssetPageY] }),
      }}>
        <SendCoinRow item={selectedAsset} onPress={this.onPressAssetHandler(selectedAsset)} />
        <TransactionContainer>
          <Row>
            <NumberInput
              autoFocus
              format={removeLeadingZeros}
              placeholder="0"
              onChange={this.onChangeAssetAmount}
              value={assetAmount}
            />
            <NumberInputLabel>{selectedAsset.symbol}</NumberInputLabel>
          </Row>
          <Row>
            <NumberInput
              buttonText="Max"
              format={formatUSDInput}
              onChange={this.onChangeNativeAmount}
              onPressButton={sendMaxBalance}
              placeholder="0.00"
              value={formatUSD(nativeAmount)}
            />
            <NumberInputLabel>USD</NumberInputLabel>
          </Row>
          <SendButton
            disabled={isZeroAssetAmount}
            leftIconName={isZeroAssetAmount ? null : 'face'}
            onPress={this.onPressSend}
          >{isZeroAssetAmount ? 'Enter An Amount' : 'Hold To Send'}</SendButton>
          <Row justify="space-between">
            <PillLabel>Fee: ${formatUSD(fee)}</PillLabel>
            <PillLabel icon="clock">Arrives in ~ {time}</PillLabel>
          </Row>
        </TransactionContainer>
      </Column>
    );
  }

  render() {
    const { recipient, isValidAddress } = this.props;

    return (
      <KeyboardAvoidingView behavior="padding">
        <Container showTopInset>
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

export default compose(connect(reduxProps, null))(SendScreen);
