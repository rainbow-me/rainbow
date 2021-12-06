import React from 'react';
import { Space } from '../../layout/space';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Box/Box' was resolved to '/Users/nickby... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Box
      padding={space}
      paddingHorizontal={horizontal}
      paddingVertical={vertical}
    >
      {children}
    </Box>
  );
}
