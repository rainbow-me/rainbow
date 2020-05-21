import React from 'react';
import styled from 'styled-components/primitives';
import { Centered } from '../layout';
import SheetHandle, { HandleHeight } from './SheetHandle';

const paddingBottom = 19;
const paddingTop = 6;

export const SheetHandleFixedToTopHeight =
  HandleHeight + paddingBottom + paddingTop;

const Container = styled(Centered)`
  left: 0;
  padding-bottom: ${paddingBottom};
  padding-top: ${paddingTop};
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

const neverRerender = () => true;
export default React.memo(SheetHandleFixedToTop, neverRerender);
