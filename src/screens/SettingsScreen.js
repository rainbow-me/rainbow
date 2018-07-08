import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import Container from '../components/Container';
import { Column } from '../components/layout';
import { Monospace } from '../components/text';
import { colors, fonts, padding } from '../styles';

const SettingsItem = styled(Column)`
  ${padding(20)}
`;

const Label = styled.Text`
  color: #25292E;
  font-size: ${fonts.size.large};
  font-weight: ${fonts.weight.semibold};
`;

const WalletAddressText = styled(Monospace)`
  margin-top: 10;
  color: ${colors.blueGreyDark};
`;

const SettingsScreen = ({ address }) => (
  <Container>
    <SettingsItem>
      <Label>Wallet address</Label>
      <WalletAddressText selectable>{address}</WalletAddressText>
    </SettingsItem>
  </Container>
);

SettingsScreen.propTypes = {
  address: PropTypes.string,
};

export default SettingsScreen;
