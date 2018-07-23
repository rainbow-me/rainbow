import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import { componentFromProp } from 'recompact';
import styled from 'styled-components/primitives';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { colors, position } from '../../styles';

const Container = styled(componentFromProp('component'))`
  ${position.size('100%')}
  background-color: ${({ color }) => color};
`;

const SafeArea = styled.View`
  padding-top: ${({ topInset }) => topInset};
  background-color: ${({ color }) => color};
`;

const Page = ({ safeAreaInset, ...props }) => (
  <SafeArea {...props} topInset={safeAreaInset.top}>
    <Container {...props} />
  </SafeArea>
);

Page.propTypes = {
  color: PropTypes.string,
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  safeAreaInset: PropTypes.shape({ top: PropTypes.number }),
};

Page.defaultProps = {
  color: colors.white,
  component: View,
};

export default withSafeAreaViewInsetValues(Page);
