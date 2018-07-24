import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';

const Container = styled.View`
  background-color: ${({ shadowColor }) => (shadowColor || '#ffffff')};
  border-radius: ${({ borderRadius }) => borderRadius};
  bottom: 0;
  box-shadow: ${({ shadow }) => shadow};
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
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
