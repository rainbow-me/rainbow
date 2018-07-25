import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { Button } from '../buttons';
import { Column } from '../layout';
import { ErrorText, Monospace } from '../text';
import { colors, padding, position } from '../../styles';

const Container = styled(Column)`
  ${padding(30, 50, 60, 30)}
  ${position.cover}
`;

const SettingsButton = styled(Button)`
  align-self: flex-start;
`;

const Text = styled(Monospace).attrs({ color: 'mediumGrey' })`
  line-height: 25;
  margin-bottom: 30;
  margin-top: 7;
`;

const QRCodeScannerNeedsAuthorization = ({ onPressSettings }) => (
  <Container align="start" justify="center">
    <ErrorText
      color={colors.white}
      error="Camera not authorized"
    />
    <Text>
      In order to use WalletConnect, you must first give Balance Wallet
      permission to access your phone's camera.
    </Text>
    <SettingsButton onPress={onPressSettings}>
      Open settings
    </SettingsButton>
  </Container>
);

QRCodeScannerNeedsAuthorization.propTypes = {
  onPressSettings: PropTypes.func,
};

export default withHandlers({
  onPressSettings: () => () =>
    Linking.canOpenURL('app-settings:').then(() => Linking.openURL('app-settings:')),
})(QRCodeScannerNeedsAuthorization);
