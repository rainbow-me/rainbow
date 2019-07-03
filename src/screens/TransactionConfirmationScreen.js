import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import lang from 'i18n-js';
import { Animated } from 'react-native';
import TouchID from 'react-native-touch-id';
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

export default class TransactionConfirmationScreen extends PureComponent {
  static propTypes = {
    dappName: PropTypes.string,
    imageUrl: PropTypes.string,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func,
    request: PropTypes.object,
    requestType: PropTypes.string,
  }

  state = {
    biometryType: null,
    sendLongPressProgress: new Animated.Value(0),
  }

  componentDidMount() {
    TouchID.isSupported()
      .then(biometryType => {
        this.setState({ biometryType });
      })
      .catch(() => {
        this.setState({ biometryType: 'FaceID' });
      });
  }

  componentWillUnmount() {
    this.state.sendLongPressProgress.stopAnimation();
  }

  onPressSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      duration: 800,
      toValue: 100,
    }).start();
  }

  onReleaseSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      duration: (sendLongPressProgress._value / 100) * 800,
      toValue: 0,
    }).start();
  }

  onLongPressSend = async () => {
    const { onConfirm, requestType } = this.props;
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      duration: (sendLongPressProgress._value / 100) * 800,
      toValue: 0,
    }).start();

    await onConfirm(requestType);
  }

  renderSendButton = () => (
    <HoldToAuthorizeButton
      isAuthorizing={this.state.isAuthorizing}
      onLongPress={this.onLongPressSend}
    >
      {`Hold to ${(this.props.requestType === 'message' || this.props.requestType === 'messagePersonal') ? 'Sign' : 'Send'}`}
    </HoldToAuthorizeButton>
  )

  renderTransactionSection = () => {
    const { request, requestType } = this.props;

    if (requestType === 'message'
        || requestType === 'messagePersonal') {
      return (
        <MessageSigningSection
          message={request}
          sendButton={this.renderSendButton()}
        />
      );
    }

    if (requestType === 'transaction') {
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
  }

  render = () => (
    <Container>
      <Masthead>
        <RequestVendorLogoIcon
          dappName={this.props.dappName}
          imageUrl={this.props.imageUrl}
          showLargeShadow={true}
          size={60}
          style={{ marginBottom: 24 }}
        />
        <Text
          color="white"
          letterSpacing="looser"
          size="h4"
          weight="semibold"
        >
          {this.props.dappName}
        </Text>
        <TransactionType>
          {lang.t('wallet.transaction.request')}
        </TransactionType>
        <CancelButtonContainer>
          <Button
            backgroundColor={colors.blueGreyMedium}
            onPress={this.props.onCancel}
            size="small"
            textProps={{ color: 'black', size: 'medium' }}
          >
            {lang.t('wallet.action.reject')}
          </Button>
        </CancelButtonContainer>
      </Masthead>
      {this.renderTransactionSection()}
    </Container>
  )
}
