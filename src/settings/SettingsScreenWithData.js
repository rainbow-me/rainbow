import React, { Component } from 'react';
import * as ethWallet from '../model/ethWallet';
import SettingsScreen from './SettingsScreen';

export default class SettingsScreenWithData extends Component {
  state = { address: '' }

  componentDidMount= () =>
    this.loadWallet()
      .then(({ address }) => this.setState({ address }))

  loadWallet = async () => ethWallet.loadWallet()

  render = () => <SettingsScreen {...this.state} />
}
