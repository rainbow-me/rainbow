import React, { useMemo, type FunctionComponent, type PropsWithChildren } from 'react';
import { View, type FlexStyle, type ViewProps } from 'react-native';

import { useChildrenIds } from '../../../hooks/useChildrenIds';
import { useDraggableGrid, type UseDraggableGridOptions } from '../hooks/useDraggableGrid';

export type DraggableGridProps = Pick<ViewProps, 'style'> &
  Pick<UseDraggableGridOptions, 'onOrderChange' | 'onOrderUpdate' | 'onOrderUpdateWorklet' | 'shouldSwapWorklet'> & {
    direction?: FlexStyle['flexDirection'];
    size: number;
    gap?: number | { x: number; y: number };
  };

export const DraggableGrid: FunctionComponent<PropsWithChildren<DraggableGridProps>> = ({
  children,
  direction = 'row',
  gap = 0,
  onOrderChange,
  onOrderUpdate,
  onOrderUpdateWorklet,
  shouldSwapWorklet,
  size,
  style: styleProp,
}) => {
  const childrenIds = useChildrenIds(children);

  const style = useMemo(
    () =>
      // eslint-disable-next-line prefer-object-spread
      Object.assign(
        {
          flexDirection: direction,
          columnGap: typeof gap === 'number' ? gap : gap.x,
          flexWrap: 'wrap',
          rowGap: typeof gap === 'number' ? gap : gap.y,
        },
        styleProp
      ),
    [gap, direction, styleProp]
  );

  useDraggableGrid({
    direction: style.flexDirection,
    gap: { x: style.columnGap, y: style.rowGap },
    childrenIds,
    onOrderChange,
    onOrderUpdate,
    onOrderUpdateWorklet,
    shouldSwapWorklet,
    size,
  });

  return <View style={style}>{children}</View>;
};
