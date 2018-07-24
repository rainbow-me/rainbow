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
  background-color: ${({ color }) => color};
  padding-bottom: ${({ bottomInset }) => bottomInset};
  padding-top: ${({ topInset }) => topInset};
`;

const Page = ({
  safeAreaInset,
  showBottomInset,
  showTopInset,
  ...props
}) => (
  <SafeArea
    {...props}
    bottomInset={showBottomInset ? safeAreaInset.bottom : 0}
    topInset={showTopInset ? safeAreaInset.top : 0}
  >
    <Container {...props} />
  </SafeArea>
);

Page.propTypes = {
  color: PropTypes.string,
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  safeAreaInset: PropTypes.shape({ top: PropTypes.number }),
  showBottomInset: PropTypes.bool,
  showTopInset: PropTypes.bool,
};

Page.defaultProps = {
  color: colors.white,
  component: View,
  showTopInset: true,
};

export default withSafeAreaViewInsetValues(Page);
