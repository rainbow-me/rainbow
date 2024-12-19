import React, { ComponentProps, ReactElement } from 'react';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useDndContext } from '../DndContext';
import { UseDraggableSortOptions } from '../features';
import { swapByItemCenterPoint } from '../utils';
import { useChildrenIds } from '../hooks';
import { useDraggableScroll } from '../features/sort/hooks/useDraggableScroll';

type AnimatedScrollViewProps = ComponentProps<typeof Animated.ScrollView>;

export type DraggableScrollViewProps = AnimatedScrollViewProps &
  Pick<UseDraggableSortOptions, 'onOrderChange' | 'onOrderUpdate' | 'onOrderUpdateWorklet' | 'shouldSwapWorklet'> & {
    children: React.ReactNode;
    gap?: number;
    horizontal?: boolean;
    debug?: boolean;
    autoScrollInsets?: {
      top?: number;
      bottom?: number;
    };
  };

export const DraggableScrollView = ({
  children,
  debug = false,
  gap = 0,
  horizontal = false,
  onOrderChange,
  onOrderUpdate,
  onOrderUpdateWorklet,
  shouldSwapWorklet = swapByItemCenterPoint,
  autoScrollInsets,
  ...otherProps
}: DraggableScrollViewProps): ReactElement => {
  const { draggableContentOffset } = useDndContext();

  const animatedScrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const contentHeight = useSharedValue(0);
  const layoutHeight = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const childrenIds = useChildrenIds(children);

  useDraggableScroll({
    childrenIds,
    onOrderChange,
    onOrderUpdate,
    onOrderUpdateWorklet,
    shouldSwapWorklet,
    horizontal,
    contentHeight,
    layoutHeight,
    autoScrollInsets,
    animatedScrollViewRef,
    scrollOffset,
    gap,
  });

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffset.value = event.contentOffset.y;
    draggableContentOffset.y.value = event.contentOffset.y;
  });

  return (
    <Animated.ScrollView
      ref={animatedScrollViewRef}
      onScroll={scrollHandler}
      onLayout={event => {
        layoutHeight.value = event.nativeEvent.layout.height;
      }}
      onContentSizeChange={(_, height) => {
        contentHeight.value = height;
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    >
      {children}
    </Animated.ScrollView>
  );
};
