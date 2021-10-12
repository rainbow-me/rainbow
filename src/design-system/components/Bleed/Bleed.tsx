import React from 'react';
import { negateSpace, Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

export type BleedProps = {
  children: BoxProps['children'];
  top?: Space;
  bottom?: Space;
  left?: Space;
  right?: Space;
  horizontal?: Space;
  vertical?: Space;
};

export const Bleed = ({
  top,
  bottom,
  left,
  right,
  horizontal,
  vertical,
  children,
}: BleedProps) => (
  <Box
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
