import React, { Component } from 'react';
import * as wallet from '../reducers/wallet';
import SettingsScreen from './SettingsScreen';

export default class SettingsScreenWithData extends Component {
  state = { address: '' }

  componentDidMount= () =>
    this.loadWallet()
      .then(({ address }) => this.setState({ address }))

  loadWallet = async () => wallet.loadWallet()

  render = () => <SettingsScreen {...this.state} />
}
