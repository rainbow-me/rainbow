import React, { Component } from 'react';
import { loadWallet }  from '../model/wallet';
import SettingsScreen from './SettingsScreen';

export default class SettingsScreenWithData extends Component {
  state = { address: '' }

  componentDidMount = () =>
    loadWallet()
      .then(({ address }) => this.setState({ address }))

  render = () => <SettingsScreen {...this.state} />
}
