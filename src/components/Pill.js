import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import { colors, padding } from '../styles';
import { TruncatedText } from './text';

const borderRadius = 10.5;

const Gradient = styled(RadialGradient).attrs({
  center: [0, borderRadius],
  colors: colors.lightGreyGradient,
})`
  ${padding(2, 6)};
  border-radius: ${borderRadius};
  overflow: hidden;
`;

export default function Pill({ children, ...props }) {
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
