import React from 'react';
import styled from 'styled-components/primitives';
import { padding } from '../../styles';
import { neverRerender } from '../../utils';
import { Centered } from '../layout';
import SheetHandle, { HandleHeight } from './SheetHandle';

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

const SheetHandleFixedToTop = ({ showBlur }) => (
  <Container>
    <SheetHandle showBlur={showBlur} />
  </Container>
);

export default neverRerender(SheetHandleFixedToTop);
