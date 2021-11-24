import React, { Children, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { CustomSpace, negateSpace, Space } from '../../layout/space';
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
      space: Space | CustomSpace;
      horizontalSpace?: Space | CustomSpace;
      verticalSpace?: Space | CustomSpace;
    }
  | {
      space?: Space | CustomSpace;
      horizontalSpace: Space | CustomSpace;
      verticalSpace: Space | CustomSpace;
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
        <Box paddingBottom={verticalSpace} paddingLeft={horizontalSpace}>
          {child}
        </Box>
      ))}
    </Box>
  );
}
