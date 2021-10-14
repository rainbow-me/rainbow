import React, { Children, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { negateSpace, Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

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

type Width = Exclude<NonNullable<BoxProps['width']>, 'full'>;

export interface ColumnProps {
  width?: Width | 'content';
  children: ReactNode;
}

export const Column = (_props: ColumnProps) => {
  throw new Error(
    'Column: Must be a direct child of Columns within the same component'
  );
};
Column.__isColumn__ = true;
Column.displayName = 'Column';

interface PrivateColumnProps extends ColumnProps {
  space: Space;
  alignVertical: AlignVertical | undefined;
}

const PrivateColumn = ({
  space,
  width,
  alignVertical,
  children,
}: PrivateColumnProps) => {
  const columnContainerProps: BoxProps = {
    flexBasis: width ? undefined : 0,
    flexGrow: width ? 0 : 1,
    flexShrink: width ? 0 : 1,
  };

  const contentContainerProps: BoxProps = {
    flexGrow: width ? 0 : 1,
    justifyContent: alignVertical
      ? alignVerticalToFlexAlign[alignVertical]
      : undefined,
    paddingRight: space,
  };

  return !width || width === 'content' ? (
    <Box {...columnContainerProps} {...contentContainerProps}>
      {children}
    </Box>
  ) : (
    <Box {...columnContainerProps} width={width}>
      <Box {...contentContainerProps}>{children}</Box>
    </Box>
  );
};
PrivateColumn.displayName = 'Column';

export interface ColumnsProps {
  space: Space;
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
}

export const Columns = ({
  children,
  alignHorizontal,
  alignVertical,
  space,
}: ColumnsProps) => (
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
    {Children.map(flattenChildren(children), child =>
      typeof child === 'object' &&
      'type' in child &&
      // @ts-expect-error
      child.type.__isColumn__ ? (
        <PrivateColumn
          {...(child.props as ColumnProps)}
          alignVertical={alignVertical}
          space={space}
        />
      ) : (
        <PrivateColumn alignVertical={alignVertical} space={space}>
          {child}
        </PrivateColumn>
      )
    )}
  </Box>
);

Columns.displayName = 'Columns';
