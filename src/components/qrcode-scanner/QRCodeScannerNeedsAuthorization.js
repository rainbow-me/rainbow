import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { compose, withHandlers } from 'recompact';
import { withNeverRerender } from '../../hoc';
import {
  colors,
  margin,
  padding,
  position,
} from '../../styles';
import { Button } from '../buttons';
import { Column } from '../layout';
import { ErrorText, Monospace } from '../text';

const QRCodeScannerNeedsAuthorization = ({ onPressSettings }) => (
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
      lineHeight="loose"
    >
      In order to use WalletConnect, you must first give Rainbow
      permission to access your camera.
    </Monospace>
    <Button self="start" onPress={onPressSettings}>
      Open settings
    </Button>
  </Column>
);

QRCodeScannerNeedsAuthorization.propTypes = {
  onPressSettings: PropTypes.func,
};

export default compose(
  withHandlers({
    onPressSettings: () => () => (
      Linking.canOpenURL('app-settings:')
        .then(() => Linking.openURL('app-settings:'))
    ),
  }),
  withNeverRerender,
)(QRCodeScannerNeedsAuthorization);
