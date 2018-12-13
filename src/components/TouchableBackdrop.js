import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/primitives';
import { position } from '../styles';

const Container = styled(TouchableOpacity)`
  ${position.cover}
  z-index: 0;
`;

const TouchableBackdrop = props => <Container {...props} />;

export default TouchableBackdrop;
