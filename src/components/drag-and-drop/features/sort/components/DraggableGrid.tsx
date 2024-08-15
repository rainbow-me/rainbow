import React, { Children, useMemo, type FunctionComponent, type PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle, type FlexStyle, type ViewProps } from 'react-native';
import type { UniqueIdentifier } from '../../../types';
import { useDraggableGrid, type UseDraggableGridOptions } from '../hooks/useDraggableGrid';

export type DraggableGridProps = Pick<ViewProps, 'style'> &
  Pick<UseDraggableGridOptions, 'onOrderChange' | 'onOrderUpdate' | 'shouldSwapWorklet'> & {
    direction?: FlexStyle['flexDirection'];
    size: number;
    gap?: number;
  };

export const DraggableGrid: FunctionComponent<PropsWithChildren<DraggableGridProps>> = ({
  children,
  direction = 'row',
  gap = 0,
  onOrderChange,
  onOrderUpdate,
  shouldSwapWorklet,
  size,
  style: styleProp,
}) => {
  const initialOrder = useMemo(
    () =>
      Children.map(children, child => {
        if (React.isValidElement(child)) {
          return child.props.id;
        }
        return null;
      })?.filter(Boolean) as UniqueIdentifier[],
    [children]
  );

  const style: StyleProp<ViewStyle> = useMemo(
    () => ({
      flexDirection: direction,
      gap,
      flexWrap: 'wrap',
      ...(styleProp as object),
    }),
    [gap, direction, styleProp]
  );

  useDraggableGrid({
    direction: style.flexDirection,
    gap: style.gap,
    initialOrder,
    onOrderChange,
    onOrderUpdate,
    shouldSwapWorklet,
    size,
  });

  return <View style={style}>{children}</View>;
};
