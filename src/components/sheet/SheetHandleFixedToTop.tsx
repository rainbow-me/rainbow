import React from 'react';
import styled from 'styled-components';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SheetHandle' was resolved to '/Users/nic... Remove this comment to see the full error message
import SheetHandle, { HandleHeight } from './SheetHandle';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const paddingBottom = 6;
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

export default function SheetHandleFixedToTop({ showBlur }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetHandle showBlur={showBlur} />
    </Container>
  );
}
