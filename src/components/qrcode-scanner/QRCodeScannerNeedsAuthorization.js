import { withSafeTimeout } from '@hocs/safe-timers';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/primitives';
import { colors, fonts, padding, position } from '../../styles';
import { Button } from '../buttons';
import { Column } from '../layout';
import { ErrorText, Monospace } from '../text';

const Container = styled(Column)`
  ${padding(30, 50, 60, 30)}
  ${position.cover}
`;

const SettingsButton = styled(Button)`
  align-self: flex-start;
`;

const Text = styled(Monospace).attrs({ color: 'mediumGrey' })`
  line-height: ${fonts.lineHeight.loose};
  margin-bottom: 30;
  margin-top: 7;
`;

class QRCodeScannerNeedsAuthorization extends PureComponent {
  static propTypes = {
    setSafeTimeout: PropTypes.func,
  }

  state = { isVisible: false }

  componentDidMount = () => this.props.setSafeTimeout(this.enableVisibility, 1000)

  enableVisibility = () => this.setState({ isVisible: true })

  onPressSettings = () =>
    Linking.canOpenURL('app-settings:').then(() => Linking.openURL('app-settings:'))

  render = () => (
    this.state.isVisible ? (
      <Container align="start" justify="center">
        <ErrorText
          color={colors.white}
          error="Camera not authorized"
        />
        <Text>
          In order to use WalletConnect, you must first give Balance Wallet
          permission to access your phone's camera.
        </Text>
        <SettingsButton onPress={this.onPressSettings}>
          Open settings
        </SettingsButton>
      </Container>
    ) : null
  )
}

export default withSafeTimeout(QRCodeScannerNeedsAuthorization);
