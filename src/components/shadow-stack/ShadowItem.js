import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';

const Container = styled.View`
  ${position.cover};
  background-color: ${({ shadowColor }) => (shadowColor || colors.white)};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ shadow }) => shadow};
`;

const getColorFromShadowString = (shadow = '') => shadow.split(' ').slice(3).join('');

const ShadowItem = ({ shadow, ...props }) => (
  <Container
    {...props}
    shadow={shadow}
    shadowColor={getColorFromShadowString(shadow)}
  />
);

ShadowItem.propTypes = {
  borderRadius: PropTypes.number,
  height: PropTypes.number,
  shadow: PropTypes.string,
  width: PropTypes.number,
};

export default ShadowItem;
