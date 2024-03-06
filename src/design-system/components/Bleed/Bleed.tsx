import React from 'react';
import { negateSpace, Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

export type BleedProps = {
  children: BoxProps['children'];
  space?: Space;
  top?: Space;
  bottom?: Space;
  left?: Space;
  right?: Space;
  horizontal?: Space;
  vertical?: Space;
};

/**
 * @description Renders a container with negative margins, allowing content
 * to "bleed" (see https://en.wikipedia.org/wiki/Bleed_(printing)) into the
 * surrounding layout. This effectively works as the opposite of `Inset` and
 * is designed to make it easy to visually break out of a parent container
 * without having to refactor the entire component tree.
 */
export function Bleed({ top, space, bottom, left, right, horizontal, vertical, children }: BleedProps) {
  return (
    <Box
      margin={space ? negateSpace(space) : undefined}
      marginBottom={bottom ? negateSpace(bottom) : undefined}
      marginHorizontal={horizontal ? negateSpace(horizontal) : undefined}
      marginLeft={left ? negateSpace(left) : undefined}
      marginRight={right ? negateSpace(right) : undefined}
      marginTop={top ? negateSpace(top) : undefined}
      marginVertical={vertical ? negateSpace(vertical) : undefined}
    >
      {children}
    </Box>
  );
}
