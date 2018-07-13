import PropTypes from 'prop-types';
import React from 'react';
import { withHandlers } from 'recompose';
import styled from 'styled-components/primitives';
import Avatar from '../components/Avatar';
import { ButtonPressAnimation } from '../components/buttons';
import { Row } from '../components/layout';

const Header = styled(Row)`
  height: 60;
  padding-bottom: 20;
  padding-left: 20;
`;

const WalletHeader = ({ onPressAvatar }) => (
  <Header align="end">
    <ButtonPressAnimation onPress={onPressAvatar}>
      <Avatar />
    </ButtonPressAnimation>
  </Header>
);

WalletHeader.propTypes = {
  onPressAvatar: PropTypes.func,
};

export default withHandlers({
  onPressAvatar: ({ navigation }) => () => navigation.navigate('SettingsScreen'),
})(WalletHeader);
