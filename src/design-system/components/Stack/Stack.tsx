import React, { Children, isValidElement, ReactElement, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { Space } from '../../layout/space';
import { Box } from '../Box/Box';
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
export function Stack({ children: childrenProp, alignHorizontal, separator, space, width }: StackProps) {
  if (__DEV__ && separator && !isValidElement(separator)) {
    throw new Error(`Stack: The 'separator' prop must be a React element`);
  }

  const children = flattenChildren(childrenProp).filter(child => isValidElement(child));

  return (
    <Box width={width} alignItems={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}>
      {Children.map(children, (child, index) => {
        const isLastChild = index === children.length - 1;

        return (
          <>
            {space && !isLastChild ? <Box paddingBottom={space}>{child}</Box> : child}
            {separator && !isLastChild ? (
              <Box
                alignItems={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}
                paddingBottom={space}
                width="full"
              >
                {separator}
              </Box>
            ) : null}
          </>
        );
      })}
    </Box>
  );
}
