import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { Row } from '../layout';

const StatusBarHeight = getStatusBarHeight(true);
const HeaderHeight = 54 + StatusBarHeight;

const Container = styled(Row).attrs({ align: 'end' })`
  ${padding(StatusBarHeight, 9, 1)}
  flex-shrink: 0;
  height: ${HeaderHeight};
  width: 100%;
`;

const Header = props => <Container {...props} />;

Header.height = HeaderHeight;

export default Header;
