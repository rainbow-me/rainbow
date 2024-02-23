import React, { useMemo } from 'react';

import { space, Space } from '../../layout/space';
import { Box, BoxProps, resolveToken } from '../Box/Box';

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
export function Inset({ space: spaceProp, horizontal, vertical, top, bottom, left, right, children }: InsetProps) {
  const margin = resolveToken(space, spaceProp);
  const marginBottom = resolveToken(space, bottom);
  const marginHorizontal = resolveToken(space, horizontal);
  const marginLeft = resolveToken(space, left);
  const marginRight = resolveToken(space, right);
  const marginTop = resolveToken(space, top);
  const marginVertical = resolveToken(space, vertical);

  const style = useMemo(
    () => ({
      margin,
      marginBottom,
      marginHorizontal,
      marginLeft,
      marginRight,
      marginTop,
      marginVertical,
    }),
    [margin, marginBottom, marginHorizontal, marginLeft, marginRight, marginTop, marginVertical]
  );

  return <Box style={style}>{children}</Box>;
}
