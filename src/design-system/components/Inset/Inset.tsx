import React from 'react';
import { Box, BoxProps } from '../Box/Box';

export type InsetProps = {
  children: BoxProps['children'];
} & (
  | {
      space?: never;
      horizontal?: BoxProps['paddingHorizontal'];
      vertical: BoxProps['paddingVertical'];
    }
  | {
      space?: never;
      horizontal: BoxProps['paddingHorizontal'];
      vertical?: BoxProps['paddingVertical'];
    }
  | {
      space: BoxProps['padding'];
      horizontal?: BoxProps['paddingHorizontal'];
      vertical?: BoxProps['paddingVertical'];
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
