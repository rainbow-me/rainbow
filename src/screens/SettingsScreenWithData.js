import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withAccountAddress } from '../hoc';
import { loadSeedPhrase } from '../model/wallet';
import SettingsScreen from './SettingsScreen';

class SettingsScreenWithData extends Component {
  static propTypes = {
    isScreenActive: PropTypes.bool,
  }

  state = { seedPhrase: null }

  shouldComponentUpdate = ({ isScreenActive, ...nextProps }, nextState) => {
    if (!isScreenActive && this.state.seedPhrase) {
      this.handleHideSeedPhrase();
    }

    const isNewProps = nextProps !== omit(this.props, 'isScreenActive');
    const isNewState = nextState !== this.state;

    return isNewProps || isNewState;
  }

  handleHideSeedPhrase = () => this.setState({ seedPhrase: null })
  handlePressBackButton = () => this.props.navigation.goBack()

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
      onPressBackButton={this.handlePressBackButton}
      onToggleShowSeedPhrase={this.handleToggleShowSeedPhrase}
    />
  )
}

export default withAccountAddress(SettingsScreenWithData);
