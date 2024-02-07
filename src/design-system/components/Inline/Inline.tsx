import React, { Children, ReactElement, ReactNode, useMemo } from 'react';
import flattenChildren from 'react-flatten-children';
import { AlignHorizontal, alignHorizontalToFlexAlign, AlignVertical, alignVerticalToFlexAlign } from '../../layout/alignment';
import { negateSpace, Space } from '../../layout/space';
import { Box } from '../Box/Box';

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

  const flattenedChildren = useMemo(() => flattenChildren(children), [children]);

  return (
    <Box
      alignItems={alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined}
      flexDirection="row"
      flexWrap={wrap ? 'wrap' : undefined}
      justifyContent={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}
      marginRight={wrap && horizontalSpace ? negateSpace(horizontalSpace) : undefined}
      marginTop={wrap && verticalSpace ? negateSpace(verticalSpace) : undefined}
    >
      {Children.map(flattenedChildren, (child, index) => {
        if (wrap) {
          return (
            <Box paddingRight={horizontalSpace} paddingTop={verticalSpace}>
              {child}
            </Box>
          );
        }

        const isLastChild = index === flattenedChildren.length - 1;
        return (
          <>
            {horizontalSpace && !isLastChild ? <Box paddingRight={horizontalSpace}>{child}</Box> : child}
            {separator && !isLastChild ? <Box paddingRight={horizontalSpace}>{separator}</Box> : null}
          </>
        );
      })}
    </Box>
  );
}
