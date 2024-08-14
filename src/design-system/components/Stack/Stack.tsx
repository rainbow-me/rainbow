import React, { Children, isValidElement, ReactElement, ReactNode } from 'react';
import { Space, space as spaceTokens } from '../../layout/space';
import { Box, resolveToken } from '../Box/Box';
import { Width } from '@/design-system/layout/size';

const alignHorizontalToFlexAlign = {
  center: 'center',
  left: 'flex-start',
  right: 'flex-end',
  stretch: 'stretch',
} as const;
type AlignHorizontal = keyof typeof alignHorizontalToFlexAlign;

export type StackProps = {
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
  space?: Space;
  separator?: ReactElement;
  width?: Width;
};

/**
 * @description Arranges child nodes vertically with equal spacing between
 * them, plus an optional `separator` element. If there is only a single
 * child node within a `Stack`, no space or separators will be rendered. Items
 * can optionally be aligned with `alignHorizontal`. Stacks can be nested
 * within each other for layouts with differing amounts of space between groups
 * of content.
 */
export function Stack({ children, alignHorizontal, separator, space, width }: StackProps) {
  if (__DEV__ && separator && !isValidElement(separator)) {
    throw new Error(`Stack: The 'separator' prop must be a React element`);
  }

  return (
    <Box
      alignItems={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}
      gap={resolveToken(spaceTokens, space)}
      width={width}
    >
      {!separator
        ? children
        : Children.map(children, (child, index) => {
            if (!child) return null;
            return (
              <>
                {index > 0 && separator}
                {child}
              </>
            );
          })}
    </Box>
  );
}
