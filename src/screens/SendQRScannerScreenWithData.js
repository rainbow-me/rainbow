import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { get } from 'lodash';
import QRScannerScreen from './QRScannerScreen';

export default class SendQRScannerScreenWithData extends Component {
  static propTypes = {
    navigation: PropTypes.object,
  }

  handlePressBackButton = () => {
    const { navigation } = this.props;

    navigation.goBack();
  }

  handleSuccess = async (event) => {
    const { navigation } = this.props;
    const onSuccess = get(navigation, 'state.params.onSuccess', () => {});

    if (event.data) {
      const parts = event.data.split(':');

      onSuccess(parts[1]);
      navigation.goBack();
    }
  }

  render() {
    return (
      <QRScannerScreen
        {...this.props}
        isScreenActive
        onPressBackButton={this.handlePressBackButton}
        onSuccess={this.handleSuccess}
      />
    );
  }
}
