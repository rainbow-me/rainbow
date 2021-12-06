import React from 'react';
import styled from 'styled-components';

const ListFooterHeight = 27;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  background-color: ${({ theme: { colors } }: any) => colors.transparent};
  height: ${({ height }: any) => height || ListFooterHeight};
  width: 100%;
`;

const neverRerender = () => true;
const ListFooter = React.memo(Spacer, neverRerender);

ListFooter.displayName = 'ListFooter';
// @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MemoExot... Remove this comment to see the full error message
ListFooter.height = ListFooterHeight;

export default ListFooter;
