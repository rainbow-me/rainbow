import PropTypes from 'prop-types';
import React from 'react';
import { compose, hoistStatics } from 'recompact';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { padding } from '../../styles';

const HeaderHeight = 54;

const Container = styled(Row).attrs({ align: 'end' })`
  ${({ topInset }) => padding((topInset - 10), 9, 10)}
  flex-shrink: 0;
  height: ${({ topInset }) => (HeaderHeight + topInset)};
  width: 100%;
`;

const Header = ({
  safeAreaInset,
  showTopInset,
  ...props
}) => (
  <Container
    {...props}
    topInset={showTopInset ? safeAreaInset.top : 0}
  />
);

Header.propTypes = {
  color: PropTypes.string,
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  safeAreaInset: PropTypes.shape({ top: PropTypes.number }),
  showTopInset: PropTypes.bool,
};

Header.defaultProps = {
  showTopInset: true,
};

Header.height = HeaderHeight;

export default compose(
  hoistStatics,
  withSafeAreaViewInsetValues,
)(Header);
