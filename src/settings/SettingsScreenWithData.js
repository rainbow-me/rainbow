import React, { Component } from 'react';
import { Alert, Clipboard } from 'react-native';
import Mailer from 'react-native-mail';
import * as ethWallet from '../model/ethWallet';
import SettingsScreen from './SettingsScreen';

const FeedbackEmailAddress = 'contact+alphafeedback@balance.io';

const handleSendFeedbackError = () =>
  Alert.alert(
    'Error launching email client',
    'Would you like to manually copy our feedback email address to your clipboard?',
    [
      { text: 'Copy email address', onPress: () => Clipboard.setString(FeedbackEmailAddress) },
      { text: 'No thanks', style: 'cancel' },
    ],
  );

export default class SettingsScreenWithData extends Component {
  state = {
    address: '',
    showSeedPhrase: false,
  }

  componentDidMount= () =>
    this.loadWallet()
      .then(({ address }) => this.setState({ address }))

  handleSendFeedback = () =>
    Mailer.mail({
      recipients: [FeedbackEmailAddress],
      subject: '📱 Balance Wallet Alpha Feedback',
    }, handleSendFeedbackError)

  handleToggleShowSeedPhrase = () =>
    this.setState(prevState => ({ showSeedPhrase: !prevState.showSeedPhrase }))

  loadWallet = async () => ethWallet.loadWallet()

  render = () => (
    <SettingsScreen
      {...this.state}
      onSendFeedback={this.handleSendFeedback}
      onToggleShowSeedPhrase={this.handleToggleShowSeedPhrase}
    />
  )
}
