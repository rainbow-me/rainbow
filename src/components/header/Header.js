import PropTypes from 'prop-types';
import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { compose, hoistStatics, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import { padding } from '../../styles';

const HeaderHeight = 54;
const HeaderPaddingBottom = 4;

const Container = styled(Row).attrs({ align: 'end' })`
  ${({ statusBarHeight }) => padding(statusBarHeight, 9, HeaderPaddingBottom)}
  flex-shrink: 0;
  height: ${({ statusBarHeight }) => (HeaderHeight + HeaderPaddingBottom + statusBarHeight)};
  width: 100%;
`;

const Header = ({ statusBarHeight, ...props }) => (
  <Container
    {...props}
    statusBarHeight={statusBarHeight}
  />
);

Header.propTypes = {
  statusBarHeight: PropTypes.number,
  statusBarSafeMode: PropTypes.bool,
};

Header.defaultProps = {
  statusBarSafeMode: true,
};

Header.height = HeaderHeight;

export default compose(
  hoistStatics,
  withProps(({ statusBarSafeMode }) => ({
    statusBarHeight: getStatusBarHeight(statusBarSafeMode),
  })),
)(Header);
