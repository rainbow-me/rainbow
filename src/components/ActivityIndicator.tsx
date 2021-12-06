import React from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { UIActivityIndicator } from 'react-native-indicators';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import { Centered } from './layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const Container = styled(Centered)`
  ${({ size }) => position.size(Number(size))};
`;

export default function ActivityIndicator({
  color,
  isInteraction = false,
  size = 25,
  ...props
}: any) {
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container size={size} {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <UIActivityIndicator
        color={color || colors.blueGreyDark}
        interaction={isInteraction}
        size={size}
      />
    </Container>
  );
}
