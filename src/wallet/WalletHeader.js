import React from 'react';
import styled from 'styled-components/primitives';
import { Row } from '../components/layout';
import Avatar from '../components/Avatar';

// 98
const Header = styled(Row)`
  height: 60;
  padding-bottom: 20;
  padding-left: 20;
`;

const WalletHeader = () => (
  <Header align="end">
    <Avatar />
  </Header>
);

export default WalletHeader;
