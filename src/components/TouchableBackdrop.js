import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { position } from '../styles';

const Container = styled(BorderlessButton)`
  ${position.cover}
  z-index: 0;
`;

const TouchableBackdrop = props => <Container {...props} />;

export default TouchableBackdrop;
