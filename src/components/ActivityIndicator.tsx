import React from 'react';
// @ts-expect-error - No types for this library
import { UIActivityIndicator } from 'react-native-indicators';
import { useTheme } from '../theme/ThemeContext';
import { Centered } from './layout';
import styled from '@/styled-thing';
import { position } from '@/styles';

const Container = styled(Centered)(({ size }: { size: number }) => position.sizeAsObject(Number(size)));

type ActivityIndicatorProps = {
  color?: string;
  isInteraction?: boolean;
  size?: number;
};

export default function ActivityIndicator({ color, isInteraction = false, size = 25, ...props }: ActivityIndicatorProps) {
  const { colors } = useTheme();
  return (
    <Container size={size} {...props}>
      <UIActivityIndicator color={color || colors.blueGreyDark} interaction={isInteraction} size={size} />
    </Container>
  );
}
