import { withSafeTimeout } from '@hocs/safe-timers';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Linking } from 'react-native';
import {
  colors,
  margin,
  padding,
  position,
} from '../../styles';
import { Button } from '../buttons';
import { Column } from '../layout';
import { ErrorText, Monospace } from '../text';

class QRCodeScannerNeedsAuthorization extends PureComponent {
  static propTypes = {
    setSafeTimeout: PropTypes.func,
  }

  state = { isVisible: false }

  componentDidMount = () => this.props.setSafeTimeout(this.enableVisibility, 500)

  enableVisibility = () => this.setState({ isVisible: true })

  onPressSettings = () => (
    Linking.canOpenURL('app-settings:')
      .then(() => Linking.openURL('app-settings:'))
  )

  render = () => (
    this.state.isVisible ? (
      <Column
        align="start"
        css={`
          ${padding(30, 50, 60, 30)};
          ${position.cover};
        `}
        justify="center"
      >
        <ErrorText
          color={colors.white}
          error="Camera not authorized"
        />
        <Monospace
          color="mediumGrey"
          css={margin(7, 0, 30)}
          lineHeight="looser"
        >
          In order to use WalletConnect, you must first give Rainbow
          permission to access your phone's camera.
        </Monospace>
        <Button self="start" onPress={this.onPressSettings}>
          Open settings
        </Button>
      </Column>
    ) : null
  )
}

export default withSafeTimeout(QRCodeScannerNeedsAuthorization);
