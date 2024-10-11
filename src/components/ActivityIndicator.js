import React from 'react';
import { UIActivityIndicator } from 'react-native-indicators';
import { useTheme } from '../theme/ThemeContext';
import { Centered } from './layout';
import styled from '@/styled-thing';
import { position } from '@/styles';

const Container = styled(Centered)(({ size }) => position.sizeAsObject(Number(size)));

export default function ActivityIndicator({ color, isInteraction = false, size = 25, ...props }) {
  const { colors } = useTheme();
  return (
    <Container size={size} {...props}>
      <UIActivityIndicator color={color || colors.blueGreyDark} interaction={isInteraction} size={size} />
    </Container>
  );
}
