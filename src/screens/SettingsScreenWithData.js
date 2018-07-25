import { debounce } from 'lodash';
import React, { Component } from 'react';
import { Alert, Clipboard } from 'react-native';
import Mailer from 'react-native-mail';
import { Transition } from 'react-navigation-fluid-transitions';
import { loadAddress, loadSeedPhrase } from '../model/wallet';
import SettingsScreen from './SettingsScreen';

const FeedbackEmailAddress = 'contact+alphafeedback@balance.io';

const handleSendFeedbackError = debounce(error => (
  error ? Alert.alert(
    'Error launching email client',
    'Would you like to manually copy our feedback email address to your clipboard?',
    [
      { text: 'Copy email address', onPress: () => Clipboard.setString(FeedbackEmailAddress) },
      { text: 'No thanks', style: 'cancel' },
    ],
  ) : null
), 250);

export default class SettingsScreenWithData extends Component {
  state = {
    address: '',
    seedPhrase: null,
  }

  componentDidMount = () => loadAddress().then(address => this.setState({ address }))

  handleSendFeedback = () =>
    Mailer.mail({
      recipients: [FeedbackEmailAddress],
      subject: '📱 Balance Wallet Alpha Feedback',
    }, handleSendFeedbackError)

  handleToggleShowSeedPhrase = () => {
    if (!this.state.seedPhrase) {
      loadSeedPhrase().then(seedPhrase => this.setState({ seedPhrase }));
    } else {
      this.setState({ seedPhrase: null });
    }
  }

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
