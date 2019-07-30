import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { Row } from '../layout';

const StatusBarHeight = getStatusBarHeight(true);
const HeaderHeight = 52;
const HeaderHeightWithStatusBar = HeaderHeight + StatusBarHeight;

const Container = styled(Row).attrs({ align: 'end' })`
  ${padding(StatusBarHeight, 9, 0)};
  flex-shrink: 0;
  height: ${({ excludeStatusBarHeight }) => (
    (excludeStatusBarHeight === true)
      ? HeaderHeight
      : HeaderHeightWithStatusBar
  )};
  width: 100%;
  z-index: 1;
`;

const Header = props => <Container {...props} />;

Header.height = HeaderHeight;

export default Header;
