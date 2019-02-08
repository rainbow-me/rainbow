import PropTypes from 'prop-types';
import React from 'react';
import { Image } from 'react-primitives';
import styled from 'styled-components/primitives';
import { borders, colors, position } from '../styles';
import Icon from './icons/Icon';
import { Centered } from './layout';
import { ShadowStack } from './shadow-stack';

const Container = styled(Centered)`
  ${position.cover}
  background-color: ${colors.lightGrey};
  border-radius: ${({ size }) => size};
`;

const Avatar = ({ size, source }) => (
  <ShadowStack
    {...borders.buildCircleAsObject(size)}
    shadows={[
      [0, 3, 5, colors.dark, 0.2],
      [0, 6, 10, colors.dark, 0.14],
    ]}
  >
    <Container size={size}>
      {source ? (
        <Image
          source={{ uri: source }}
          {...position.coverAsObject}
          style={position.sizeAsObject(size)}
        />
      ) : (
        <Icon
          name="avatar"
          size={size}
        />
      )}
    </Container>
  </ShadowStack>
);

Avatar.propTypes = {
  size: PropTypes.number.isRequired,
  source: PropTypes.string,
};

Avatar.defaultProps = {
  size: 32,
};

export default Avatar;
