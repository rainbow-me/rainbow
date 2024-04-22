/* eslint-disable no-nested-ternary */
import React, { Children, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { AlignHorizontal, alignHorizontalToFlexAlign, AlignVertical, alignVerticalToFlexAlign } from '../../layout/alignment';
import { negateSpace, Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

type Width = Exclude<NonNullable<BoxProps['width']>, 'full'>;

export interface ColumnProps {
  width?: Width | 'content';
  children?: ReactNode;
  style?: AnimatedStyle;
}

/**
 * @description Provides manual control of column widths within `Columns`.
 * Children of `Columns` are equal-width by default, but you can optionally
 * render a `Column` element instead which allows you to specify a `width`
 * prop. Note that `Column` must be rendered as an immediate child of
 * `Columns` or it will throw an error. You can set a fractional width, e.g.
 * `<Column width="1/3">`, or make the column shrink to fit the size of the
 * content with `<Column width="content">`. Any columns without an
 * explicit width will share the remaining space equally.
 */
export function Column(_props: ColumnProps): JSX.Element {
  throw new Error('Column: Must be a direct child of Columns within the same component.');
}
Column.__isColumn__ = true;

const getColumnProps = (node: NonNullable<ReactNode>): ColumnProps | null =>
  typeof node === 'object' &&
  'type' in node &&
  // This lets us detect Column elements even if they've been hot reloaded.
  // If we checked that node.type === Column, it will fail if Column has been
  // dynamically replaced with a new component.
  // @ts-expect-error
  node.type.__isColumn__
    ? (node.props as ColumnProps)
    : null;

interface PrivateColumnProps extends ColumnProps {
  space?: Space;
  alignVertical?: AlignVertical | undefined;
  style?: AnimatedStyle;
}

// This is the component that's rendered instead of the Column component that
// consumers have access to. The public Column component is essentially used
// as a mechanism for providing access to this component's props without
// leaking private implementation detail.
function PrivateColumn({ space, width, alignVertical, children, style }: PrivateColumnProps) {
  return (
    <Box
      as={Animated.View}
      flexBasis={width ? undefined : 0}
      flexGrow={width ? 0 : 1}
      flexShrink={width ? 0 : 1}
      justifyContent={alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined}
      paddingRight={space}
      width={width !== 'content' ? width : undefined}
      style={style}
    >
      {children}
    </Box>
  );
}

export interface ColumnsProps {
  space?: Space;
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
}

/**
 * @description Renders children in equal-width columns with consistent
 * spacing between them. You can optionally control column widths by
 * manually rendering a `Column` as a direct child of `Columns`, which allows
 * you to set an explicit `width` prop, e.g. `<Column width="content">` will
 * cause the column to shrink to the size of its content. When setting custom
 * widths, any columns without an explicit width will share the remaining space
 * equally. Columns can optionally be aligned horizontally and/or vertically,
 * but note that this only affects the columns themselves relative to the
 * container, not the content within the column. To align content within a
 * column, you'll need to nest another layout component inside, e.g.
 * `<Stack alignHorizontal="center">...</Stack>`.
 */
export function Columns({ children, alignHorizontal, alignVertical, space }: ColumnsProps) {
  return (
    <Box
      alignItems={alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined}
      flexDirection="row"
      justifyContent={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}
      marginRight={space ? negateSpace(space) : undefined}
    >
      {Children.map(flattenChildren(children), child => {
        const columnProps = getColumnProps(child);
        return columnProps ? (
          <PrivateColumn {...columnProps} alignVertical={alignVertical} space={space} />
        ) : (
          <PrivateColumn alignVertical={alignVertical} space={space}>
            {child}
          </PrivateColumn>
        );
      })}
    </Box>
  );
}
