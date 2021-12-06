import React from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { Centered, RowWithMargins } from '../components/layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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

export default function NetworkPill({ children, mainnet, ...props }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container mainnet={mainnet}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Gradient {...props} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins margin={5}>{children}</RowWithMargins>
    </Container>
  );
}
