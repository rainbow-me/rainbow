import React from 'react';
import { UIActivityIndicator } from 'react-native-indicators';
import { useTheme } from '../context/ThemeContext';
import { Centered } from './layout';
import { position } from '@rainbow-me/styles';
import styled from 'rainbowed-components';

const Container = styled(Centered)(({ size }) =>
  position.sizeAsObject(Number(size))
);

export default function ActivityIndicator({
  color,
  isInteraction = false,
  size = 25,
  ...props
}) {
  const { colors } = useTheme();
  return (
    <Container size={size} {...props}>
      <UIActivityIndicator
        color={color || colors.blueGreyDark}
        interaction={isInteraction}
        size={size}
      />
    </Container>
  );
}
