import React from 'react';
import styled from 'styled-components/primitives';
import { Centered } from '../layout';
import SheetHandle, { HandleHeight } from './SheetHandle';
import { padding } from '@rainbow-me/styles';

const paddingBottom = 8;
const paddingTop = 6;

export const SheetHandleFixedToTopHeight =
  HandleHeight + paddingBottom + paddingTop;

const Container = styled(Centered).attrs({
  pointerEvents: 'none',
})`
  ${padding(paddingTop, 0, paddingBottom)};
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 9;
`;

export default function SheetHandleFixedToTop({ showBlur }) {
  return (
    <Container>
      <SheetHandle showBlur={showBlur} />
    </Container>
  );
}
