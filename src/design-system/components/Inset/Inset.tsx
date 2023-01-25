import React from 'react';
import { Box, BoxProps } from '../Box/Box';

export type InsetProps = {
  children: BoxProps['children'];
  space?: number;
  horizontal?: number;
  vertical?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
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
  const style = {
    margin: space,
    marginBottom: bottom,
    marginHorizontal: horizontal,
    marginLeft: left,
    marginRight: right,
    marginTop: top,
    marginVertical: vertical,
  };

  return <Box style={style}>{children}</Box>;
}
