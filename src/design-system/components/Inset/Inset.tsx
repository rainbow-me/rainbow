import React from 'react';
import { Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

export type InsetProps = {
  children: BoxProps['children'];
} & (
  | {
      space?: never;
      horizontal?: Space;
      vertical: Space;
    }
  | {
      space?: never;
      horizontal: Space;
      vertical?: Space;
    }
  | {
      space: Space;
      horizontal?: Space;
      vertical?: Space;
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
