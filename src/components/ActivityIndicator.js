import React from 'react';
import { UIActivityIndicator } from 'react-native-indicators';
import { useTheme } from '../theme/ThemeContext';
import { Centered } from './layout';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

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
