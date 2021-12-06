import React, {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
} from 'react';
import flattenChildren from 'react-flatten-children';
import { Space } from '../../layout/space';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Box/Box' was resolved to '/Users/nickby... Remove this comment to see the full error message
import { Box } from '../Box/Box';

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
} & (
  | { space?: never; separator: ReactElement }
  | {
      space: Space;
      separator?: ReactElement;
    }
);

/**
 * @description Arranges child nodes vertically with equal spacing between
 * them, plus an optional `separator` element. If there is only a single
 * child node within a `Stack`, no space or separators will be rendered. Items
 * can optionally be aligned with `alignHorizontal`. Stacks can be nested
 * within each other for layouts with differing amounts of space between groups
 * of content.
 */
export function Stack({
  children,
  alignHorizontal,
  separator,
  space,
}: StackProps) {
  if (__DEV__ && separator && !isValidElement(separator)) {
    throw new Error(`Stack: The 'separator' prop must be a React element`);
  }

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Box
      alignItems={
        alignHorizontal
          ? alignHorizontalToFlexAlign[alignHorizontal]
          : undefined
      }
    >
      {Children.map(flattenChildren(children), (child, index) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          {separator && index > 0 ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Box
              alignItems={
                alignHorizontal
                  ? alignHorizontalToFlexAlign[alignHorizontal]
                  : undefined
              }
              paddingTop={space}
              width="full"
            >
              {separator}
            </Box>
          ) : null}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {space && index > 0 ? <Box paddingTop={space}>{child}</Box> : child}
        </>
      ))}
    </Box>
  );
}
