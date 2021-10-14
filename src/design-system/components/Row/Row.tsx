import React, { Children, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { negateSpace } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

type Space = NonNullable<BoxProps['paddingTop']>;

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
  space: Space;
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
};

export const Row = ({
  children,
  alignHorizontal,
  alignVertical,
  space,
}: RowProps) => (
  <Box
    alignItems={
      alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined
    }
    flexDirection="row"
    justifyContent={
      alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined
    }
    marginRight={negateSpace(space)}
  >
    {Children.map(flattenChildren(children), child => (
      <Box flexShrink={1} paddingRight={space}>
        {child}
      </Box>
    ))}
  </Box>
);
