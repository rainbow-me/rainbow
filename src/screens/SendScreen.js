import _ from 'underscore';
import { get } from 'lodash';
import React, { Component } from 'react';
import { Animated, Clipboard, Image, KeyboardAvoidingView, Text, TextInput, View } from 'react-native';
import styled from 'styled-components/primitives';
import { compose } from 'recompact';
import { connect } from 'react-redux';
import { isValidAddress } from 'balance-common';

import { abbreviations } from '../utils';
import { AssetList, UniqueTokenRow } from '../components/asset-list';
import { Button, BlockButton } from '../components/buttons';
import { colors, fonts, padding } from '../styles';
import { Monospace } from '../components/text';
import { Column, Page, Flex, FlexItem, FlyInView, Row } from '../components/layout';
import { SendCoinRow } from '../components/coin-row';
import { UnderlineField } from '../components/fields';
import { PillLabel } from '../components/labels';
import { formatUSD } from '../utils/formatters';

const Container = styled(Page)`
  background-color: ${colors.white};
  align-items: center;
  flex-grow: 1;
`;

const AddressInput = styled(TextInput)`
  flex-grow: 1;
  font-size: ${fonts.size.h5}
  font-family: ${fonts.family.SFMono};
  font-weight: ${fonts.weight.semibold};
  color: ${props => props.isValid ? colors.sendScreen.brightBlue : colors.blueGreyDark};
  margin-top: 1px;
`;

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

// const CameraIcon = styled(Image)`
//   margin-top: -5px;
//   height: 14px;
//   width: 17px;
// `;

const NumberInput = styled(UnderlineField).attrs({ keyboardType: 'number-pad' })`
  margin-bottom: 15px;
  margin-right: 30px;
`;

const NumberInputLabel = styled(Monospace)`
  fontSize: ${fonts.size.h2};
  color: ${colors.blueGreyDark};
`;

const TransactionContainer = styled(View)`
  ${padding(20, 20)}
  flex-grow: 1;
  background-color: ${colors.lightGrey};
  margin-bottom: 0;
`;

const SendButton = styled(BlockButton)`
  margin-top: 15px;
  margin-bottom: 30px;
`;

class SendScreen extends Component {
  static propTypes = {

  };

  static defaultProps = {

  };

  constructor(props) {
    super(props);

    this.state = {
      address: {
        full: '',
        abbreviation: '',
        isValid: false,
      },
      selectedAsset: {},
      selectedAssetAnimation: new Animated.Value(1),
      selectedAssetPageY: 0,
      transaction: {},
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

  onChangeAddressInput = ({ nativeEvent }) => {
    const { address } = this.state;

    this.setState({
      address: {
        full: address.isValid ? address.full.substring(0, address.full.length - 1) : nativeEvent.text,
        abbreviation: abbreviations.address(nativeEvent.text),
        isValid: address.isValid ? false : isValidAddress(nativeEvent.text),
      },
    });
  };

  onPressPaste = () => {
    Clipboard.getString()
      .then((string) => {
        const isValid = isValidAddress(string);

        this.setState({
          address: {
            full: string,
            abbreviation: isValid && abbreviations.address(string),
            isValid,
          },
        });
      });
  };

  onPressCamera = () => {

  };

  onPressAssetHandler = (selectedAsset) => {
    return ({ nativeEvent }) => {
      this.setState({ selectedAsset, selectedAssetPageY: nativeEvent.pageY });
    };
  };

  onPressSend = () => {

  };

  onPressMax = () => {
    const { transaction } = this.props;
    const { selectedAsset } = this.state;

    const balanceAmount = Number(get(selectedAsset, 'native.balance.amount'));
    const fixedBalanceAmount = (balanceAmount / (10 ** 18)).toFixed(2);
    const amount = String(fixedBalanceAmount);

    this.setState({ transaction: { ...transaction, usd: formatUSD(amount) } });
  };

  onChangeAsset = (value) => {
    const { transaction } = this.props;

    this.setState({ transaction: { ...transaction, asset: value } });
  };

  onChangeUSD = (value) => {
    const { transaction } = this.props;

    this.setState({ transaction: { ...transaction, usd: value } });
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
        <AssetList sections={[sections.balances]} hideHeader hideFooter />
      </FlyInView>
    );
  }

  renderAssets() {
    const { selectedAsset } = this.state;

    return (
      <Flex>
        {!_.isEmpty(selectedAsset) ? null : this.renderAssetList()}
        {!_.isEmpty(selectedAsset) ? this.renderTransaction() : null}
      </Flex>
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
          {/* <BottomButton onPress={this.onPressCamera}><CameraIcon source={require('../assets/camera.png')} /></BottomButton> */}
        </BottomButtonContainer>
      </FlexItem>
    );
  }

  renderTransaction() {
    const { selectedAsset, selectedAssetAnimation, selectedAssetPageY, transaction } = this.state;

    return (
      <Column style={{
        width: '100%',
        height: '100%',
        flexGrow: 1,
        // top: selectedAssetAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, selectedAssetPageY] }),
      }}>
        <SendCoinRow item={selectedAsset} onPress={this.onPressAssetHandler({})} />
        <TransactionContainer>
          <Row>
            <NumberInput
              autoFocus
              format={(value) => Number(value)}
              maxLength={8}
              placeholder="0"
              onChangeAsset={this.onChangeAsset}
              value={transaction.asset}
            />
            <NumberInputLabel>{selectedAsset.symbol}</NumberInputLabel>
          </Row>
          <Row>
            <NumberInput
              buttonText="Max"
              format={formatUSD}
              maxLength={8}
              onChange={this.onChangeUSD}
              onPressButton={this.onPressMax}
              placeholder="0.00"
              value={transaction.usd}
            />
            <NumberInputLabel>USD</NumberInputLabel>
          </Row>
          <SendButton leftIconName="face" onLongPress={this.onPressSend}>Hold To Send</SendButton>
          <Row justify="space-between">
            <PillLabel>Fee: $0.06</PillLabel>
            <PillLabel icon="clock">Arrives in ~ 2 min</PillLabel>
          </Row>
        </TransactionContainer>
      </Column>
    );
  }

  render() {
    const { address } = this.state;

    return (
      <KeyboardAvoidingView behavior="height">
        <Container showTopInset>
          <AddressInputContainer>
            <AddressInputLabel>To:</AddressInputLabel>
            <AddressInput
              autoFocus
              isValid={address.isValid}
              onChange={this.onChangeAddressInput}
              placeholder="Ethereum Address: (0x...)"
              value={address.isValid ? address.abbreviation : address.full}
            />
          </AddressInputContainer>
          <AddressInputBottomBorder />
          {address.isValid ? this.renderAssets() : this.renderEmptyState()}
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
