import PropTypes from 'prop-types';
import React from 'react';
import { Image } from 'react-primitives';
import styled from 'styled-components/primitives';
import { borders, colors, position, shadow } from '../styles';
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
      shadow.buildString(0, 1.5, 2.5),
      shadow.buildString(0, 3, 5),
    ]}
  >
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
  </ShadowStack>
);

Avatar.propTypes = {
  size: PropTypes.number.isRequired,
  source: PropTypes.string,
};

Avatar.defaultProps = {
  size: 30,
};

export default Avatar;
