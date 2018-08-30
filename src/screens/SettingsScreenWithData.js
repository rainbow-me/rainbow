import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Alert, Clipboard } from 'react-native';

import { loadAddress, loadSeedPhrase } from '../model/wallet';
import SettingsScreen from './SettingsScreen';

export default class SettingsScreenWithData extends Component {
  static propTypes = {
    isScreenActive: PropTypes.bool,
  }

  state = {
    address: '',
    seedPhrase: null,
  }

  shouldComponentUpdate = ({ isScreenActive, ...nextProps }, nextState) => {
    if (!isScreenActive && this.state.seedPhrase) {
      this.handleHideSeedPhrase();
    }

    const isNewProps = nextProps !== omit(this.props, 'isScreenActive');
    const isNewState = nextState !== this.state;

    return isNewProps || isNewState;
  }

  componentDidMount = () => loadAddress().then(address => this.setState({ address }))

  handleHideSeedPhrase = () => this.setState({ seedPhrase: null })

  handleToggleShowSeedPhrase = () => {
    if (!this.state.seedPhrase) {
      loadSeedPhrase().then(seedPhrase => this.setState({ seedPhrase }));
    } else {
      this.handleHideSeedPhrase();
    }
  }

  render = () => (
    <SettingsScreen
      {...this.props}
      {...this.state}
      onToggleShowSeedPhrase={this.handleToggleShowSeedPhrase}
    />
  )
}
