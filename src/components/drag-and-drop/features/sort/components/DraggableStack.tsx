import React, { Children, useMemo, type FunctionComponent, type PropsWithChildren } from 'react';
import { View, type FlexStyle, type ViewProps } from 'react-native';
import type { UniqueIdentifier } from '../../../types';
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
  const initialOrder = useMemo(
    () =>
      Children.map(children, child => {
        // console.log("in");
        if (React.isValidElement(child)) {
          return child.props.id;
        }
        return null;
      })?.filter(Boolean) as UniqueIdentifier[],
    [children]
  );

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
    initialOrder,
    onOrderChange,
    onOrderUpdate,
    shouldSwapWorklet,
  });

  return <View style={style}>{children}</View>;
};
