import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { Centered, RowWithMargins } from '../components/layout';
import { position } from '@rainbow-me/styles';

const Container = styled(Centered)`
  height: 30;
  margin-right: 19;
  padding-left: ${({ mainnet }) => (mainnet ? 10 : 5)};
  padding-right: 10;
`;

const Gradient = styled(RadialGradient).attrs(
  ({ theme: { colors, isDarkMode } }) => ({
    center: [0, 15],
    colors: isDarkMode
      ? colors.gradients.lightestGreyReverse
      : colors.gradients.lightestGrey,
  })
)`
  ${position.cover};
  border-radius: 15;
  flex-direction: row;
  height: 30;
  overflow: hidden;
`;

export default function NetworkPill({ children, mainnet, ...props }) {
  return (
    <Container mainnet={mainnet}>
      <Gradient {...props} />
      <RowWithMargins margin={5}>{children}</RowWithMargins>
    </Container>
  );
}
