import React, { useMemo, type FunctionComponent, type PropsWithChildren } from 'react';
import { View, type FlexStyle, type ViewProps } from 'react-native';
import { useChildrenIds } from '../../../hooks';
import { useDraggableStack, type UseDraggableStackOptions } from '../hooks/useDraggableStack';

export type DraggableStackProps = Pick<ViewProps, 'style'> &
  Pick<UseDraggableStackOptions, 'onOrderChange' | 'onOrderUpdate' | 'shouldSwapWorklet'> & {
    direction?: FlexStyle['flexDirection'];
    gap?: number;
  };

export const DraggableStack: FunctionComponent<PropsWithChildren<DraggableStackProps>> = ({
  children,
  direction = 'row',
  gap = 0,
  onOrderChange,
  onOrderUpdate,
  shouldSwapWorklet,
  style: styleProp,
}) => {
  const childrenIds = useChildrenIds(children);

  const style = useMemo(
    () => ({
      flexDirection: direction,
      gap,
      ...(styleProp as object),
    }),
    [gap, direction, styleProp]
  );

  const horizontal = ['row', 'row-reverse'].includes(style.flexDirection);

  useDraggableStack({
    gap: style.gap,
    horizontal,
    childrenIds,
    onOrderChange,
    onOrderUpdate,
    shouldSwapWorklet,
  });

  return <View style={style}>{children}</View>;
};
