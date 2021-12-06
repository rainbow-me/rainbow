import React, { Children, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { negateSpace, Space } from '../../layout/space';
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

export type InlineProps = {
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
} & (
  | {
      space: Space;
      horizontalSpace?: Space;
      verticalSpace?: Space;
    }
  | {
      space?: Space;
      horizontalSpace: Space;
      verticalSpace: Space;
    }
);

/**
 * @description Renders flowing content with equal spacing between items
 * both horizontally and vertically, wrapping to multiple lines if needed.
 */
export function Inline({
  children,
  alignHorizontal,
  alignVertical,
  space,
  horizontalSpace: horizontalSpaceProp,
  verticalSpace: verticalSpaceProp,
}: InlineProps) {
  const verticalSpace = verticalSpaceProp ?? space;
  const horizontalSpace = horizontalSpaceProp ?? space;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Box
      alignItems={
        alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined
      }
      flexDirection="row"
      flexWrap="wrap"
      justifyContent={
        alignHorizontal
          ? alignHorizontalToFlexAlign[alignHorizontal]
          : undefined
      }
      marginBottom={verticalSpace ? negateSpace(verticalSpace) : undefined}
      marginLeft={horizontalSpace ? negateSpace(horizontalSpace) : undefined}
    >
      {Children.map(flattenChildren(children), child => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Box paddingBottom={verticalSpace} paddingLeft={horizontalSpace}>
          {child}
        </Box>
      ))}
    </Box>
  );
}
