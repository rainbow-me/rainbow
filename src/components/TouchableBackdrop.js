import PropTypes from 'prop-types';
import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { position } from '../styles';

const Container = styled(BorderlessButton)`
  ${position.cover};
  z-index: ${({ zIndex }) => (zIndex)};
`;

const TouchableBackdrop = props => <Container {...props} />;

TouchableBackdrop.propTypes = {
  zIndex: PropTypes.number,
};

TouchableBackdrop.defaultProps = {
  zIndex: 0,
};

export default TouchableBackdrop;
