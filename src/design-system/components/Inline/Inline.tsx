import React, { Children, ReactElement, ReactNode } from 'react';
import { AlignHorizontal, alignHorizontalToFlexAlign, AlignVertical, alignVerticalToFlexAlign } from '../../layout/alignment';
import { Space, space as spaceTokens } from '../../layout/space';
import { Box, resolveToken } from '../Box/Box';

export type InlineProps = {
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
  space?: Space;
  horizontalSpace?: Space;
  verticalSpace?: Space;
} & (
  | {
      separator?: undefined;
      wrap?: true;
    }
  | {
      separator?: ReactElement;
      wrap: false;
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
  separator,
  wrap = true,
}: InlineProps) {
  const verticalSpace = verticalSpaceProp ?? space;
  const horizontalSpace = horizontalSpaceProp ?? space;

  return (
    <Box
      alignItems={alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined}
      flexDirection="row"
      flexWrap={wrap ? 'wrap' : undefined}
      justifyContent={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}
      style={{
        columnGap: horizontalSpace ? resolveToken(spaceTokens, horizontalSpace) : undefined,
        rowGap: verticalSpace ? resolveToken(spaceTokens, verticalSpace) : undefined,
      }}
    >
      {wrap || !separator
        ? children
        : Children.toArray(children).map((child, index) => {
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
