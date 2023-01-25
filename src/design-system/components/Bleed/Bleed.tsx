import React from 'react';
import { Box, BoxProps } from '../Box/Box';

export type BleedProps = {
  children: BoxProps['children'];
  space?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  horizontal?: number;
  vertical?: number;
};

/**
 * @description Renders a container with negative margins, allowing content
 * to "bleed" (see https://en.wikipedia.org/wiki/Bleed_(printing)) into the
 * surrounding layout. This effectively works as the opposite of `Inset` and
 * is designed to make it easy to visually break out of a parent container
 * without having to refactor the entire component tree.
 */
export function Bleed({
  top,
  space,
  bottom,
  left,
  right,
  horizontal,
  vertical,
  children,
}: BleedProps) {
  return (
    <Box
      margin={space ? -space : undefined}
      marginBottom={bottom ? -bottom : undefined}
      marginHorizontal={horizontal ? -horizontal : undefined}
      marginLeft={left ? -left : undefined}
      marginRight={right ? -right : undefined}
      marginTop={top ? -top : undefined}
      marginVertical={vertical ? -vertical : undefined}
    >
      {children}
    </Box>
  );
}
