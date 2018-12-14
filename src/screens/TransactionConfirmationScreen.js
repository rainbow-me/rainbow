import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import lang from 'i18n-js';
import { Animated } from 'react-native';
import TouchID from 'react-native-touch-id';
import styled from 'styled-components';
import BalanceManagerLogo from '../assets/balance-manager-logo.png';
import { BlockButton, Button, LongPressButton } from '../components/buttons';
import { Centered, Column } from '../components/layout';
import TransactionConfirmationSection from '../components/TransactionConfirmationSection';
import MessageSigningSection from '../components/MessageSigningSection';
import { Text } from '../components/text';
import { borders, colors, fonts, padding, position } from '../styles';

const SendButton = styled(BlockButton).attrs({ component: LongPressButton })`
  ${padding(0, 0)}
`;

const CancelButtonContainer = styled.View`
  bottom: 22;
  position: absolute;
  right: 19;
`;

const Container = styled(Column)`
  ${position.size('100%')}
  background-color: ${colors.black};
  flex: 1;
`;

const Masthead = styled(Centered).attrs({ direction: 'column' })`
  flex: 1;
  padding-bottom: 2px;
  width: 100%;
`;

const TransactionType = styled(Text).attrs({ size: 'h5' })`
  color: ${colors.alpha(colors.white, 0.68)}
  margin-top: 6;
`;

const VendorLogo = styled.Image`
  ${position.size('100%')}
  resize-mode: contain;
`;

const VenderLogoContainer = styled(Centered)`
  ${position.size(60)}
  margin-bottom: 24;
`;

const VendorName = styled(Text).attrs({
  size: 'h4',
  weight: 'semibold',
})`
  color: ${colors.white};
  letter-spacing: -0.2px;
`;

class TransactionConfirmationScreen extends Component {
  static propTypes = {
    dappName: PropTypes.string,
    request: PropTypes.object,
    requestType: PropTypes.string,
    onCancelTransaction: PropTypes.func,
    onConfirm: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      biometryType: null,
      sendLongPressProgress: new Animated.Value(0),
    };
  };

  componentDidMount() {
    TouchID.isSupported()
      .then(biometryType => {
        this.setState({ biometryType });
      })
      .catch(() => {
        this.setState({ biometryType: 'FaceID' });
      });
  }

  onPressSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      toValue: 50,
      duration: 400,
    }).start();
  };

  onReleaseSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      toValue: 0,
      duration: (sendLongPressProgress._value / 100) * 800,
    }).start();
  };

  onLongPressSend = async () => {
    const { onConfirm, requestType } = this.props;
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      toValue: 0,
      duration: (sendLongPressProgress._value / 100) * 800,
    }).start();

    await onConfirm(requestType);
  };

  renderSendButton() {
    const { requestType } = this.props;
    const { biometryType, sendLongPressProgress } = this.state;
    const leftIconName = biometryType === 'FaceID' ? 'faceid' : 'touchid';
    const label = (requestType === 'message') ? 'Hold to Sign' : 'Hold to Send';
    return (
      <SendButton
        disabled={false}
        leftIconName={leftIconName}
        onLongPress={this.onLongPressSend}
        onPress={this.onPressSend}
        onRelease={this.onReleaseSend}
        rightIconName={'progress'}
        rightIconProps={{
          color: colors.alpha(colors.sendScreen.grey, 0.3),
          progress: sendLongPressProgress,
          progressColor: colors.white,
        }}
      >
        {label}
      </SendButton>
    );
  }

  render = () => {
    const {
      dappName,
      request,
      requestType,
      onCancelTransaction,
    } = this.props;

    return (
      <Container>
        <Masthead>
          <VenderLogoContainer>
            <VendorLogo source={BalanceManagerLogo} />
          </VenderLogoContainer>
          <VendorName>{dappName}</VendorName>
          <TransactionType>{lang.t('wallet.transaction.request')}</TransactionType>
          <CancelButtonContainer>
            <Button
              bgColor={colors.blueGreyMedium}
              onPress={onCancelTransaction}
              size="small"
              textProps={{ color: 'black', size: 'medium' }}
            >
              {lang.t('wallet.action.reject')}
            </Button>
          </CancelButtonContainer>
        </Masthead>
        {requestType === 'message' ? (<MessageSigningSection
          message={request}
          sendButton={this.renderSendButton()}
        />) :
        (<TransactionConfirmationSection
          asset={{
            address: get(request, 'to'),
            amount: get(request, 'value', '0.00'),
            name: get(request, 'asset.name', 'No data'),
            nativeAmountDisplay: get(request, 'nativeAmountDisplay'),
            symbol: get(request, 'asset.symbol', 'N/A'),
          }}
          sendButton={this.renderSendButton()}
        />)}
      </Container>
    )
  }
};

export default TransactionConfirmationScreen;
