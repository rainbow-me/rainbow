import React, { ComponentProps, ReactElement, useCallback, useMemo } from 'react';
import { CellRendererProps } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { AnimatedProps, useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useDndContext } from '../DndContext';
import { UseDraggableStackOptions } from '../features';
import type { UniqueIdentifier } from '../types';
import { swapByItemCenterPoint } from '../utils';
import { Draggable } from './Draggable';
import { useDraggableScroll } from '../features/sort/hooks/useDraggableScroll';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimatedFlatListProps<ItemT = any> = AnimatedProps<ComponentProps<typeof FlatList<ItemT>>>;

export type ViewableRange = {
  first: number | null;
  last: number | null;
};

type DraggableProps = ComponentProps<typeof Draggable>;
type DraggablePropsWithoutId = Omit<DraggableProps, 'id' | 'children'>;

export type DraggableFlatListProps<T extends { id: UniqueIdentifier }> = AnimatedFlatListProps<T> &
  Pick<UseDraggableStackOptions, 'onOrderChange' | 'onOrderUpdate' | 'shouldSwapWorklet'> & {
    debug?: boolean;
    gap?: number;
    horizontal?: boolean;
    draggableProps?: DraggablePropsWithoutId;
    autoScrollInsets?: {
      top?: number;
      bottom?: number;
    };
  };

export const DraggableFlatList = <T extends { id: UniqueIdentifier }>({
  data,
  debug,
  gap = 0,
  horizontal = false,
  onOrderChange,
  onOrderUpdate,
  renderItem,
  shouldSwapWorklet = swapByItemCenterPoint,
  draggableProps,
  autoScrollInsets,
  ...otherProps
}: DraggableFlatListProps<T>): ReactElement => {
  const { draggableContentOffset } = useDndContext();
  const animatedFlatListRef = useAnimatedRef<Animated.ScrollView>();
  const contentHeight = useSharedValue(0);
  const layoutHeight = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  // @ts-expect-error reanimated type issue
  const childrenIds = useMemo(() => data?.map((item: T) => item.id) ?? [], [data]);

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffset.value = event.contentOffset.y;
    draggableContentOffset.y.value = event.contentOffset.y;
  });

  useDraggableScroll({
    childrenIds,
    onOrderChange,
    onOrderUpdate,
    shouldSwapWorklet,
    horizontal,
    contentHeight,
    layoutHeight,
    autoScrollInsets,
    animatedScrollViewRef: animatedFlatListRef,
    scrollOffset,
    gap,
  });

  /* ⚠️ IMPROVEMENT: Optionally expose visible range to the parent */
  // const viewableRange = useSharedValue<ViewableRange>({
  //   first: null,
  //   last: null,
  // });

  // const onViewableItemsChanged = useCallback<NonNullable<FlatListProps<T>['onViewableItemsChanged']>>(
  //   ({ viewableItems }) => {
  //     viewableRange.value = {
  //       first: viewableItems[0].index,
  //       last: viewableItems[viewableItems.length - 1].index,
  //     };
  //     if (debug)
  //       console.log(`First viewable item index: ${viewableItems[0].index}, last: ${viewableItems[viewableItems.length - 1].index}`);
  //   },
  //   [debug, viewableRange]
  // );
  /** END */

  const CellRenderer = useCallback(
    (cellProps: CellRendererProps<T>) => <DraggableFlatListCellRenderer {...cellProps} draggableProps={draggableProps} />,
    [draggableProps]
  );

  /** 🛠️ DEBUGGING */
  // useAnimatedReaction(
  //   () => {
  //     const activeId = draggableActiveId.value;
  //     return activeId ? draggableStates.value[activeId].value : 'resting';
  //   },
  //   (next, prev) => {
  //     if (debug) console.log(`Active item state: ${prev} -> ${next}`);
  //     if (debug) console.log(`translationY.value=${draggableContentOffset.y.value}`);
  //   }
  // );

  // useAnimatedReaction(
  //   () => draggableActiveId.value,
  //   (next, prev) => {
  //     if (debug) console.log(`activeId: ${prev} -> ${next}`);
  //   }
  // );
  /** END */

  return (
    <Animated.FlatList
      CellRendererComponent={CellRenderer}
      data={data}
      onScroll={scrollHandler}
      onLayout={event => {
        layoutHeight.value = event.nativeEvent.layout.height;
      }}
      onContentSizeChange={(_, height) => {
        contentHeight.value = height;
      }}
      // IMPROVEMENT: optionally implement
      // onViewableItemsChanged={onViewableItemsChanged}
      ref={animatedFlatListRef}
      removeClippedSubviews={false}
      renderItem={renderItem}
      keyExtractor={(item: T) => item.id.toString()}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderScrollComponent={(props: any) => {
        return (
          <Animated.ScrollView
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
          />
        );
      }}
      // viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      // eslint-disable-next-line react/jsx-props-no-spreading, @typescript-eslint/no-explicit-any
      {...(otherProps as any)}
    />
  );
};

type DraggableCellRendererProps<ItemT extends { id: UniqueIdentifier }> = CellRendererProps<ItemT> & {
  draggableProps?: DraggablePropsWithoutId;
};

export const DraggableFlatListCellRenderer = function DraggableFlatListCellRenderer<ItemT extends { id: UniqueIdentifier }>(
  props: DraggableCellRendererProps<ItemT>
) {
  const { item, children, draggableProps, ...otherProps } = props;
  return (
    <Draggable activeScale={1.025} dragDirection="y" id={item.id.toString()} {...draggableProps} {...otherProps}>
      {children}
    </Draggable>
  );
};
