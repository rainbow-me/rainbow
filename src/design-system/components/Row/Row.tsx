import React, { Children, ReactElement, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { Space } from '../../layout/space';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Box/Box' was resolved to '/Users/nickby... Remove this comment to see the full error message
import { Box } from '../Box/Box';

const alignHorizontalToFlexAlign = {
  center: 'center',
  justify: 'space-between',
  left: 'flex-start',
  right: 'flex-end',
} as const;
type AlignHorizontal = keyof typeof alignHorizontalToFlexAlign;

const alignVerticalToFlexAlign = {
  bottom: 'flex-end',
  center: 'center',
  top: 'flex-start',
} as const;
type AlignVertical = keyof typeof alignVerticalToFlexAlign;

export type RowProps = {
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
} & (
  | { space?: never; separator: ReactElement }
  | {
      space: Space;
      separator?: ReactElement;
    }
);

/**
 * @description Arranges child nodes horizontally with equal spacing between
 * them, plus an optional `separator` element. Items can optionally be aligned
 * horizontally and/or vertically with `alignHorizontal` and `alignVertical`.
 */
export function Row({
  children,
  alignHorizontal,
  alignVertical,
  separator,
  space,
}: RowProps) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Box
      alignItems={
        alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined
      }
      flexDirection="row"
      justifyContent={
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
            <Box paddingLeft={space}>{separator}</Box>
          ) : null}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {space && index > 0 ? <Box paddingLeft={space}>{child}</Box> : child}
        </>
      ))}
    </Box>
  );
}
