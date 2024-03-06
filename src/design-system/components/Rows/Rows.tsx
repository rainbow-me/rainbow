import React, { Children, ReactNode } from 'react';
import flattenChildren from 'react-flatten-children';
import { AlignVertical, alignVerticalToFlexAlign } from '../../layout/alignment';
import { negateSpace, Space } from '../../layout/space';
import { Box, BoxProps } from '../Box/Box';

type Height = Exclude<NonNullable<BoxProps['height']>, 'full'>;

export interface RowProps {
  height?: Height | 'content';
  children: ReactNode;
}

/**
 * @description Provides manual control of row heights within `Rows`.
 * Children of `Rows` are equal-height by default, but you can optionally
 * render a `Row` element instead which allows you to specify a `height`
 * prop. Note that `Row` must be rendered as an immediate child of
 * `Rows` or it will throw an error. You can set a fractional height, e.g.
 * `<Row height="1/3">`, or make the row shrink to fit the size of the
 * content with `<Row height="content">`. Any rows without an
 * explicit height will share the remaining space equally.
 */
export function Row(_props: RowProps): JSX.Element {
  throw new Error('Row: Must be a direct child of Rows within the same component.');
}
Row.__isRow__ = true;

const getRowProps = (node: NonNullable<ReactNode>): RowProps | null =>
  typeof node === 'object' &&
  'type' in node &&
  // This lets us detect Row elements even if they've been hot reloaded.
  // If we checked that node.type === Row, it will fail if Row has been
  // dynamically replaced with a new component.
  // @ts-expect-error
  node.type.__isRow__
    ? (node.props as RowProps)
    : null;

interface PrivateRowProps extends RowProps {
  space?: Space;
  alignHorizontal: AlignHorizontal | undefined;
}

// This is the component that's rendered instead of the Row component that
// consumers have access to. The public Row component is essentially used
// as a mechanism for providing access to this component's props without
// leaking private implementation detail.
function PrivateRow({ space, height, alignHorizontal, children }: PrivateRowProps) {
  return (
    <Box
      alignItems={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}
      flexBasis={height ? undefined : 0}
      flexGrow={height ? 0 : 1}
      flexShrink={height ? 0 : 1}
      height={height !== 'content' ? height : undefined}
      paddingBottom={space}
    >
      {children}
    </Box>
  );
}

const alignHorizontalToFlexAlign = {
  center: 'center',
  left: 'flex-start',
  right: 'flex-end',
} as const;
type AlignHorizontal = keyof typeof alignHorizontalToFlexAlign;

export interface RowsProps {
  space?: Space;
  children: ReactNode;
  alignHorizontal?: AlignHorizontal;
  alignVertical?: AlignVertical;
}

/**
 * @description Renders children in equal-height rows with consistent
 * spacing between them. You can optionally control row heights by
 * manually rendering a `Row` as a direct child of `Rows`, which allows
 * you to set an explicit `height` prop, e.g. `<Row height="content">` will
 * cause the row to shrink to the size of its content. When setting custom
 * heights, any rows without an explicit height will share the remaining space
 * equally. Rows can optionally be aligned horizontally and/or vertically,
 * but note that this only affects the rows themselves relative to the
 * container, not the content within the row. To align content within a
 * row, you'll need to nest another layout component inside, e.g.
 * `<Stack alignHorizontal="center">...</Stack>`.
 */
export function Rows({ children, alignHorizontal, alignVertical, space }: RowsProps) {
  const flattenedChildren = flattenChildren(children);

  return (
    <Box
      alignItems={alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined}
      flexDirection="column"
      flexGrow={1}
      justifyContent={alignVertical ? alignVerticalToFlexAlign[alignVertical] : undefined}
      marginBottom={space ? negateSpace(space) : undefined}
    >
      {Children.map(flattenedChildren, child => {
        const rowProps = getRowProps(child);

        return rowProps ? (
          <PrivateRow {...rowProps} alignHorizontal={alignHorizontal} space={space} />
        ) : (
          <PrivateRow alignHorizontal={alignHorizontal} space={space}>
            {child}
          </PrivateRow>
        );
      })}
    </Box>
  );
}
