import React from 'react';
import { CustomSpace, Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

export type InsetProps = {
  children: BoxProps['children'];
} & (
  | {
      space?: never;
      horizontal?: Space | CustomSpace;
      vertical: Space | CustomSpace;
    }
  | {
      space?: never;
      horizontal: Space | CustomSpace;
      vertical?: Space | CustomSpace;
    }
  | {
      space: Space | CustomSpace;
      horizontal?: Space | CustomSpace;
      vertical?: Space | CustomSpace;
    }
);

/**
 * @description Renders a container with equal padding on each axis.
 */
export function Inset({ space, horizontal, vertical, children }: InsetProps) {
  return (
    <Box
      padding={space}
      paddingHorizontal={horizontal}
      paddingVertical={vertical}
    >
      {children}
    </Box>
  );
}
