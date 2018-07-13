import PropTypes from 'prop-types';
import React from 'react';
import { Image } from 'react-primitives';
import styled from 'styled-components/primitives';
import { colors, position, shadow } from '../styles';
import Icon from './icons/Icon';
import { Centered } from './layout';

const Container = styled(Centered)`
  ${shadow.build(0, 1.5, 2.5)}
  ${shadow.build(0, 3, 5)}
  ${({ size }) => position.size(size)}
  background-color: ${colors.lightGrey};
  border-radius: ${({ size }) => size};
  overflow: hidden;
`;

const Avatar = ({ size, source }) => (
  <Container size={size}>
    {source ? (
      <Image
        source={{ uri: source }}
        style={position.sizeAsObject(size)}
      />
    ) : (
      <Icon name="avatar" />
    )}
  </Container>
);

Avatar.propTypes = {
  size: PropTypes.number.isRequired,
  source: PropTypes.string,
};

Avatar.defaultProps = {
  size: 30,
  // source: 'https://pbs.twimg.com/profile_images/586603361241321472/lSYz_Uqj_400x400.jpg',
};

export default Avatar;
