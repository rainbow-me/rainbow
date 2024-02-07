import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { Centered, RowWithMargins } from '../components/layout';
import styled from '@/styled-thing';
import { position } from '@/styles';

const Container = styled(Centered)({
  height: 30,
  marginRight: 19,
  paddingLeft: ({ mainnet }) => (mainnet ? 10 : 5),
  paddingRight: 10,
});

const Gradient = styled(RadialGradient).attrs(({ theme: { colors, isDarkMode } }) => ({
  center: [0, 15],
  colors: isDarkMode ? colors.gradients.lightestGreyReverse : colors.gradients.lightestGrey,
}))({
  ...position.coverAsObject,
  borderRadius: 15,
  flexDirection: 'row',
  height: 30,
  overflow: 'hidden',
});

export default function NetworkPill({ children, mainnet, ...props }) {
  return (
    <Container mainnet={mainnet}>
      <Gradient {...props} />
      <RowWithMargins margin={5}>{children}</RowWithMargins>
    </Container>
  );
}
