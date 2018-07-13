import { debounce } from 'lodash';
import React, { Component } from 'react';
import { Alert, Clipboard } from 'react-native';
import Mailer from 'react-native-mail';
import { Transition } from 'react-navigation-fluid-transitions';
import * as ethWallet from '../model/ethWallet';
import SettingsScreen from './SettingsScreen';

const FeedbackEmailAddress = 'contact+alphafeedback@balance.io';

const handleSendFeedbackError = debounce(() =>
  Alert.alert(
    'Error launching email client',
    'Would you like to manually copy our feedback email address to your clipboard?',
    [
      { text: 'Copy email address', onPress: () => Clipboard.setString(FeedbackEmailAddress) },
      { text: 'No thanks', style: 'cancel' },
    ],
  ), 250);

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
    <Transition appear='left' disappear='left'>
      <SettingsScreen
        {...this.state}
        onSendFeedback={this.handleSendFeedback}
        onToggleShowSeedPhrase={this.handleToggleShowSeedPhrase}
      />
    </Transition>
  )
}
