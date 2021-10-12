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

export const Inset = ({
  space,
  horizontal,
  vertical,
  children,
}: InsetProps) => (
  <Box
    padding={space}
    paddingHorizontal={horizontal}
    paddingVertical={vertical}
  >
    {children}
  </Box>
);
