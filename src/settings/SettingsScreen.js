import PropTypes from 'prop-types';
import React, { Component } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { compose, withHandlers } from 'recompose';
import styled from 'styled-components/primitives';
import { Centered, Column } from '../components/layout';
import { Monospace } from '../components/text';
import { colors, fonts, padding, position } from '../styles';

import ToolTip from 'react-native-tooltip';

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${padding(0, 31)}
  height: 100%;
`;

const WalletAddressTextContainer = styled(Centered).attrs({ direction: 'column' })`
  margin-top: 22;
  width: 100%;
`;

const QRCodePadding = 25;
const QRCodeImageSize = 150;
const shadowColor = colors.alpha(colors.black, 0.04);

const QRCodeContainer = styled(Centered)`
  ${padding(QRCodePadding)}
  ${position.size(QRCodeImageSize + (QRCodePadding * 2))}
  background-color: ${colors.white};
  border-color: ${shadowColor};
  border-radius: 24;
  border-width: 1;
  box-shadow: 0 3px 5px ${shadowColor};
  box-shadow: 0 6px 10px ${shadowColor};
`;

const SettingsScreen = ({ address, onCopyAddress }) => (
  <Container>
    <QRCodeContainer>
      {address && <QRCode size={QRCodeImageSize} value={address} />}
    </QRCodeContainer>
    <WalletAddressTextContainer>
      <ToolTip
        actions={[{ onPress: onCopyAddress, text: 'Copy' }]}
        underlayColor={colors.transparent}
      >
        <Monospace size="big" weight="semibold">{address}</Monospace>
      </ToolTip>
    </WalletAddressTextContainer>
  </Container>
);

SettingsScreen.propTypes = {
  address: PropTypes.string,
  onCopyAddress: PropTypes.func,
};

export default compose(
  withHandlers({
    onCopyAddress: () => () => {

    },
  }),
)(SettingsScreen);
