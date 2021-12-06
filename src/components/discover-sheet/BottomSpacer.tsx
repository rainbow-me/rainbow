import React from 'react';
import styled from 'styled-components';
import {
  FabWrapperBottomPosition,
  FloatingActionButtonSize,
} from '../../components/fab';

const SpacerHeight = FabWrapperBottomPosition + FloatingActionButtonSize;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: ${SpacerHeight};
  width: 100%;
`;

export default function BottomSpacer() {
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Spacer />;
}
