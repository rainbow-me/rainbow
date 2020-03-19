import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import lang from 'i18n-js';
import { Animated } from 'react-native';
import styled from 'styled-components';
import { Button, HoldToAuthorizeButton } from '../components/buttons';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { Centered, Column } from '../components/layout';
import {
  DefaultTransactionConfirmationSection,
  MessageSigningSection,
  TransactionConfirmationSection,
} from '../components/transaction';
import { Text } from '../components/text';
import { colors, position } from '../styles';
import {
  isMessageDisplayType,
  isTransactionDisplayType,
  SEND_TRANSACTION,
} from '../utils/signingMethods';

const CancelButtonContainer = styled.View`
  bottom: 19;
  position: absolute;
  right: 19;
`;

const Container = styled(Column)`
  ${position.size('100%')}
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

export default class TransactionConfirmationScreen extends PureComponent {
  static propTypes = {
    dappName: PropTypes.string,
    imageUrl: PropTypes.string,
    method: PropTypes.string,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func,
    request: PropTypes.object,
  };

  state = {
    isAuthorizing: false,
    sendLongPressProgress: new Animated.Value(0),
  };

  componentWillUnmount() {
    this.state.sendLongPressProgress.stopAnimation();
  }

  onPressSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      duration: 800,
      toValue: 100,
    }).start();
  };

  onReleaseSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      duration: (sendLongPressProgress._value / 100) * 800,
      toValue: 0,
    }).start();
  };

  onLongPressSend = async () => {
    const { onConfirm } = this.props;
    const { sendLongPressProgress } = this.state;

    this.setState({ isAuthorizing: true });
    Animated.timing(sendLongPressProgress, {
      duration: (sendLongPressProgress._value / 100) * 800,
      toValue: 0,
    }).start();

    try {
      await onConfirm();
      this.setState({ isAuthorizing: false });
    } catch (error) {
      this.setState({ isAuthorizing: false });
    }
  };

  renderSendButton = () => {
    const { method } = this.props;
    const { isAuthorizing } = this.state;
    const label = `Hold to ${method === SEND_TRANSACTION ? 'Send' : 'Sign'}`;

    return (
      <HoldToAuthorizeButton
        isAuthorizing={isAuthorizing}
        label={label}
        onLongPress={this.onLongPressSend}
      />
    );
  };

  requestHeader = () => {
    const { method } = this.props;
    return isMessageDisplayType(method)
      ? lang.t('wallet.message_signing.request')
      : lang.t('wallet.transaction.request');
  };

  renderTransactionSection = () => {
    const { request, method } = this.props;

    if (isMessageDisplayType(method)) {
      return (
        <MessageSigningSection
          message={request}
          sendButton={this.renderSendButton()}
        />
      );
    }

    if (isTransactionDisplayType(method) && get(request, 'asset')) {
      return (
        <TransactionConfirmationSection
          asset={{
            address: get(request, 'to'),
            amount: get(request, 'value', '0.00'),
            name: get(request, 'asset.name', 'No data'),
            nativeAmountDisplay: get(request, 'nativeAmountDisplay'),
            symbol: get(request, 'asset.symbol', 'N/A'),
          }}
          sendButton={this.renderSendButton()}
        />
      );
    }

    return (
      <DefaultTransactionConfirmationSection
        asset={{
          address: get(request, 'to'),
          data: get(request, 'data'),
          value: get(request, 'value'),
        }}
        sendButton={this.renderSendButton()}
      />
    );
  };

  render = () => (
    <Container>
      <Masthead>
        <RequestVendorLogoIcon
          backgroundColor="transparent"
          dappName={this.props.dappName}
          imageUrl={this.props.imageUrl}
          size={60}
          style={{ marginBottom: 24 }}
        />
        <Text
          color="white"
          letterSpacing="roundedMedium"
          size="h4"
          weight="semibold"
        >
          {this.props.dappName}
        </Text>
        <TransactionType>{this.requestHeader()}</TransactionType>
        <CancelButtonContainer>
          <Button
            backgroundColor={colors.alpha(colors.grey, 0.4)}
            onPress={this.props.onCancel}
            showShadow={false}
            size="small"
            textProps={{ color: colors.black, size: 'lmedium' }}
          >
            {lang.t('wallet.action.reject')}
          </Button>
        </CancelButtonContainer>
      </Masthead>
      {this.renderTransactionSection()}
    </Container>
  );
}
