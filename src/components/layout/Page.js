import PropTypes from 'prop-types';
import React from 'react';
import { SafeAreaView } from 'react-navigation';
import { View } from 'react-primitives';
import { componentFromProp } from 'recompose';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';

const Container = styled(componentFromProp('component'))`
  ${position.size('100%')}
  background-color: ${({ color }) => color};
`;

const SafeArea = styled(SafeAreaView)`
  background-color: ${({ color }) => color};
`;

const Page = props => (
  <SafeArea {...props}>
    <Container {...props} />
  </SafeArea>
);

Page.propTypes = {
  color: PropTypes.string,
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
};

Page.defaultProps = {
  color: colors.white,
  component: View,
};

export default Page;
