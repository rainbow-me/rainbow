import React from 'react';
import { Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

export type InsetProps = {
  children: BoxProps['children'];
  space?: Space;
  horizontal?: Space;
  vertical?: Space;
  top?: Space;
  bottom?: Space;
  left?: Space;
  right?: Space;
};

/**
 * @description Renders a container with padding.
 */
export function Inset({
  space,
  horizontal,
  vertical,
  top,
  bottom,
  left,
  right,
  children,
}: InsetProps) {
  return (
    <Box
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
