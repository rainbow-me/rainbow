import React, { Children, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import {
  AlignHorizontal,
  alignHorizontalToFlexAlign,
  AlignVertical,
  alignVerticalToFlexAlign,
} from '../../layout/alignment';
import { negateSpace, Space } from '../../layout/space';
import { Box } from '../Box/Box';

export type InlineProps = {
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
  space?: Space;
  horizontalSpace?: Space;
  verticalSpace?: Space;
};

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
      marginRight={horizontalSpace ? negateSpace(horizontalSpace) : undefined}
      marginTop={verticalSpace ? negateSpace(verticalSpace) : undefined}
    >
      {Children.map(flattenChildren(children), child => (
        <Box paddingRight={horizontalSpace} paddingTop={verticalSpace}>
          {child}
        </Box>
      ))}
    </Box>
  );
}
