import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { useTheme } from '../theme/ThemeContext';
import { TruncatedText } from './text';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { Box, Text } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';

const Gradient = styled(RadialGradient).attrs(({ theme: { colors }, borderRadius = 10.5 }) => ({
  center: [0, borderRadius],
  colors: colors.gradients.lightGrey,
}))(({ borderRadius, paddingHorizontal, paddingVertical }) => ({
  ...padding.object(paddingVertical || 2, paddingHorizontal || 6),
  borderRadius: borderRadius || 10.5,
  overflow: 'hidden',
}));

export default function Pill({ children, textColor, ...props }) {
  const { colors } = useTheme();

  return (
    <Gradient {...props} justifyContent="center" alignItems="center">
      <TruncatedText
        align="center"
        color={textColor || opacity(colors.blueGreyDark, 0.5)}
        letterSpacing="uppercase"
        size="smedium"
        weight="semibold"
        {...props}
      >
        {children}
      </TruncatedText>
    </Gradient>
  );
}
