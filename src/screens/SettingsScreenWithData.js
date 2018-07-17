import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Alert, Clipboard } from 'react-native';
import Mailer from 'react-native-mail';
import { Transition } from 'react-navigation-fluid-transitions';
import { loadWallet, loadSeedPhrase } from '../model/wallet';
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
  static propTypes = {
    navigation: PropTypes.object,
  }

  state = {
    address: '',
    showSeedPhrase: false,
    seedPhrase: '',
  }

  componentDidMount = () => {
    loadWallet().then(({ address }) => {
      loadSeedPhrase().then(seedPhrase => {
        this.setState({ address, seedPhrase });
      });
    });
  };

  handlePressBackButton = () => this.props.navigation.goBack()

  handleSendFeedback = () =>
    Mailer.mail({
      recipients: [FeedbackEmailAddress],
      subject: '📱 Balance Wallet Alpha Feedback',
    }, handleSendFeedbackError)

  handleToggleShowSeedPhrase = () =>
    this.setState(prevState => ({ showSeedPhrase: !prevState.showSeedPhrase }))

  render = () => (
    <Transition appear='left' disappear='left'>
      <SettingsScreen
        {...this.state}
        onPressBackButton={this.handlePressBackButton}
        onSendFeedback={this.handleSendFeedback}
        onToggleShowSeedPhrase={this.handleToggleShowSeedPhrase}
      />
    </Transition>
  )
}
