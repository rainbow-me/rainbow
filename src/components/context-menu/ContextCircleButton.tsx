import React from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './ContextMenu' or its correspo... Remove this comment to see the full error message
import ContextMenu from './ContextMenu';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, position } from '@rainbow-me/styles';

const CircleButton = styled(RadialGradient).attrs(({ theme: { colors } }) => ({
  center: [0, 20],
  colors: colors.gradients.lightestGrey,
}))`
  ${borders.buildCircle(40)};
  ${position.centered};
  overflow: hidden;
`;

const ContextIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'zero',
  size: 'larger',
  weight: 'bold',
}))`
  height: 100%;
  line-height: 39px;
  width: 100%;
`;

export default function ContextCircleButton(props: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ContextMenu {...props} activeOpacity={1}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CircleButton {...props}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ContextIcon>􀍠</ContextIcon>
      </CircleButton>
    </ContextMenu>
  );
}
