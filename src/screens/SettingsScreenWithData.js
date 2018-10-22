import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { InteractionManager } from 'react-native';
import { withAccountAddress } from '../hoc';
import { loadSeedPhrase } from '../model/wallet';
import SettingsScreen from './SettingsScreen';

class SettingsScreenWithData extends Component {
  static propTypes = {
    isScreenActive: PropTypes.bool,
  }

  state = { seedPhrase: null }

  shouldComponentUpdate = ({ accountAddress, isScreenActive }, nextState) => {
    if (!isScreenActive && this.state.seedPhrase) {
      this.handleSeedPhraseState();
    }

    const isNewAddress = this.props.accountAddress !== accountAddress;
    const isNewScreenActive = this.props.isScreenActive !== isScreenActive;

    const isNewProps = isNewAddress || isNewScreenActive;
    const isNewState = nextState !== this.state;

    return isNewProps || isNewState;
  }

  handlePressBackButton = () => this.props.navigation.navigate('WalletScreen')

  handleSeedPhraseState = (seedPhrase = null) =>
    InteractionManager.runAfterInteractions(() => this.setState({ seedPhrase }))

  toggleShowSeedPhrase = () => {
    if (!this.state.seedPhrase) {
      loadSeedPhrase().then(this.handleSeedPhraseState);
    } else {
      this.handleSeedPhraseState();
    }
  }

  render = () => (
    <SettingsScreen
      {...this.props}
      {...this.state}
      onPressBackButton={this.handlePressBackButton}
      onToggleShowSeedPhrase={this.toggleShowSeedPhrase}
    />
  )
}

export default withAccountAddress(SettingsScreenWithData);
