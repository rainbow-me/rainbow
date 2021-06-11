import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import { TruncatedText } from './text';
import { padding } from '@rainbow-me/styles';

const borderRadius = 10.5;

const Gradient = styled(RadialGradient).attrs(({ theme: { colors } }) => ({
  center: [0, borderRadius],
  colors: colors.gradients.lightGrey,
}))`
  ${padding(2, 6)};
  border-radius: ${borderRadius};
  overflow: hidden;
`;

export default function Pill({ children, ...props }) {
  const { colors } = useTheme();

  return (
    <Gradient {...props}>
      <TruncatedText
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        letterSpacing="uppercase"
        size="smedium"
        weight="semibold"
      >
        {children}
      </TruncatedText>
    </Gradient>
  );
}
