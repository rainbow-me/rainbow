import React from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import { TruncatedText } from './text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Gradient = styled(RadialGradient).attrs(
  ({ theme: { colors }, borderRadius = 10.5 }) => ({
    center: [0, borderRadius],
    colors: colors.gradients.lightGrey,
  })
)`
  ${({ paddingVertical, paddingHorizontal }) =>
    padding(paddingVertical || 2, paddingHorizontal || 6)};
  border-radius: ${({ borderRadius }) => borderRadius || 10.5};
  overflow: hidden;
`;

export default function Pill({ children, ...props }: any) {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Gradient {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
