import React from 'react';
import { Centered } from '../layout';
import SheetHandle, { HandleHeight } from './SheetHandle';
import styled from '@/styled-thing';
import { padding } from '@/styles';

const paddingBottom = 6;
const paddingTop = 6;

export const SheetHandleFixedToTopHeight = HandleHeight + paddingBottom + paddingTop;

const Container = styled(Centered)({
  ...padding.object(paddingTop, 0, paddingBottom),
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 9,
});

export default function SheetHandleFixedToTop({ showBlur }) {
  return (
    <Container>
      <SheetHandle showBlur={showBlur} />
    </Container>
  );
}
