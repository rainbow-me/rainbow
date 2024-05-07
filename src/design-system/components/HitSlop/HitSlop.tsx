import React from 'react';
import { negateSpace, Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

export type HitSlopProps = {
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
 * @description Renders additional space around a component to increase the
 * tappable area without affecting the layout of neighboring components.
 * This is useful for improving touch targets on small or tightly packed
 * elements.
 */
export function HitSlop({ top, space, bottom, left, right, horizontal, vertical, children }: HitSlopProps) {
  return (
    <Box
      margin={space ? negateSpace(space) : undefined}
      marginBottom={bottom ? negateSpace(bottom) : undefined}
      marginHorizontal={horizontal ? negateSpace(horizontal) : undefined}
      marginLeft={left ? negateSpace(left) : undefined}
      marginRight={right ? negateSpace(right) : undefined}
      marginTop={top ? negateSpace(top) : undefined}
      marginVertical={vertical ? negateSpace(vertical) : undefined}
      padding={space}
      paddingBottom={bottom}
      paddingHorizontal={horizontal}
      paddingLeft={left}
      paddingRight={right}
      paddingTop={top}
      paddingVertical={vertical}
    >
      {children}
    </Box>
  );
}
