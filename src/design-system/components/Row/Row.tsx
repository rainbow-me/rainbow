import React, { Children, ReactElement, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { Space } from '../../layout/space';
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
  space?: Space;
  separator?: ReactElement;
};

/**
 * @description Arranges child nodes horizontally with equal spacing between
 * them, plus an optional `separator` element. Items can optionally be aligned
 * horizontally and/or vertically with `alignHorizontal` and `alignVertical`.
 */
export function Row({
  children: childrenProp,
  alignHorizontal,
  alignVertical,
  separator,
  space,
}: RowProps) {
  const children = flattenChildren(childrenProp);

  return (
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
      {Children.map(children, (child, index) => {
        const isLastChild = index === children.length - 1;

        return (
          <>
            {space && !isLastChild ? (
              <Box paddingRight={space}>{child}</Box>
            ) : (
              child
            )}
            {separator && !isLastChild ? (
              <Box paddingRight={space}>{separator}</Box>
            ) : null}
          </>
        );
      })}
    </Box>
  );
}
