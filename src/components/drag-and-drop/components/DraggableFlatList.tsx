import React, { ComponentProps, ReactElement, useCallback, useMemo } from 'react';
import { CellRendererProps } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, {
  AnimatedProps,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { AnimatedFlatList } from '@/components/AnimatedComponents/AnimatedFlatList';
import { useDndContext } from '../DndContext';
import { useDraggableSort, UseDraggableStackOptions } from '../features';
import type { UniqueIdentifier } from '../types';
import { applyOffset, swapByItemCenterPoint } from '../utils';
import { Draggable } from './Draggable';

const AUTOSCROLL_THRESHOLD = 50;
const AUTOSCROLL_MIN_SPEED = 1;
const AUTOSCROLL_MAX_SPEED = 3;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimatedFlatListProps<ItemT = any> = AnimatedProps<ComponentProps<typeof FlatList<ItemT>>>;

export type ViewableRange = {
  first: number | null;
  last: number | null;
};

export type DraggableFlatListProps<T extends { id: UniqueIdentifier }> = AnimatedFlatListProps<T> &
  Pick<UseDraggableStackOptions, 'onOrderChange' | 'onOrderUpdate' | 'shouldSwapWorklet'> & {
    debug?: boolean;
    gap?: number;
    horizontal?: boolean;
  };

function normalizeWorklet(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) {
  'worklet';
  return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
}

export const DraggableFlatList = <T extends { id: UniqueIdentifier }>({
  data,
  debug,
  gap = 0,
  horizontal = false,
  // initialOrder,
  onOrderChange,
  onOrderUpdate,
  renderItem,
  shouldSwapWorklet = swapByItemCenterPoint,
  ...otherProps
}: DraggableFlatListProps<T>): ReactElement => {
  const { draggableActiveId, draggableContentOffset, draggableLayouts, draggableOffsets, draggableRestingOffsets, draggableActiveLayout } =
    useDndContext();
  const animatedFlatListRef = useAnimatedRef<FlatList<T>>();
  const contentHeight = useSharedValue(0);
  const visibleHeight = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  // @ts-expect-error TODO: fix
  const initialOrder = useMemo(() => data?.map((item: T) => item.id) ?? [], [data]);

  const { draggableSortOrder } = useDraggableSort({
    horizontal,
    initialOrder,
    onOrderChange,
    onOrderUpdate,
    shouldSwapWorklet,
  });

  const direction = horizontal ? 'column' : 'row';
  const size = 1;

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffset.value = event.contentOffset.y;
    draggableContentOffset.y.value = event.contentOffset.y;
  });

  const autoscroll = useCallback(
    (offset: number) => {
      'worklet';

      // round to the nearest 0.5 to make scrolling smoother
      const smoothedOffset = Math.round(offset * 2) / 2;

      const { value: activeId } = draggableActiveId;

      // this is similar logic to how the pan gesture onUpdate works in the DndProvider
      if (activeId) {
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;

        const activeLayout = layouts[activeId].value;
        const activeOffset = offsets[activeId];

        // if we have reached the bottom of the list, stop scrolling
        if (draggableActiveLayout.value && draggableActiveLayout.value.y + smoothedOffset > contentHeight.value - AUTOSCROLL_THRESHOLD) {
          return;
        }

        // if we have reached the top of the list, stop scrolling
        if (scrollOffset.value + smoothedOffset < 0) {
          return;
        }

        scrollTo(animatedFlatListRef, 0, scrollOffset.value + smoothedOffset, false);

        activeOffset.y.value += smoothedOffset;

        draggableActiveLayout.value = applyOffset(activeLayout, {
          x: activeOffset.x.value,
          y: activeOffset.y.value,
        });
      }
    },
    [draggableActiveId, draggableLayouts, draggableOffsets, draggableActiveLayout, contentHeight, animatedFlatListRef, scrollOffset]
  );

  // Track sort order changes and update the offsets
  useAnimatedReaction(
    () => draggableSortOrder.value,
    (nextOrder, prevOrder) => {
      // Ignore initial reaction
      if (prevOrder === null) {
        return;
      }
      const { value: activeId } = draggableActiveId;
      const { value: layouts } = draggableLayouts;
      const { value: offsets } = draggableOffsets;
      const { value: restingOffsets } = draggableRestingOffsets;
      if (!activeId) {
        return;
      }

      const activeLayout = layouts[activeId].value;
      const { width, height } = activeLayout;
      const restingOffset = restingOffsets[activeId];

      for (let nextIndex = 0; nextIndex < nextOrder.length; nextIndex++) {
        const itemId = nextOrder[nextIndex];
        const prevIndex = prevOrder.findIndex(id => id === itemId);
        // Skip items that haven't changed position
        if (nextIndex === prevIndex) {
          continue;
        }

        const prevRow = Math.floor(prevIndex / size);
        const prevCol = prevIndex % size;
        const nextRow = Math.floor(nextIndex / size);
        const nextCol = nextIndex % size;
        const moveCol = nextCol - prevCol;
        const moveRow = nextRow - prevRow;

        const offset = itemId === activeId ? restingOffset : offsets[itemId];

        if (!restingOffset || !offsets[itemId]) {
          continue;
        }

        switch (direction) {
          case 'row':
            offset.y.value += moveRow * (height + gap);
            break;
          case 'column':
            offset.x.value += moveCol * (width + gap);
            break;
          default:
            break;
        }
      }
    },
    []
  );

  /* ⚠️ TODO: Expose visible range to the parent */
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

  // On each frame that the draggable item's position (offsetY) changes,
  // if it's within the threshold, we scroll relative to how far over the threshold it is.
  // This runs every frame while the user is dragging and the item remains in the scroll trigger zone,
  useAnimatedReaction(
    () => draggableActiveLayout.value?.y,
    activeItemY => {
      if (activeItemY === undefined) return;

      const bottomThreshold = scrollOffset.value + visibleHeight.value - AUTOSCROLL_THRESHOLD;
      const isNearBottom = activeItemY >= bottomThreshold;

      const topThreshold = scrollOffset.value + AUTOSCROLL_THRESHOLD;
      const isNearTop = activeItemY <= topThreshold;

      if (isNearTop) {
        const distanceFromTopThreshold = topThreshold - activeItemY;
        const scrollSpeed = normalizeWorklet(distanceFromTopThreshold, 0, AUTOSCROLL_THRESHOLD, AUTOSCROLL_MIN_SPEED, AUTOSCROLL_MAX_SPEED);
        autoscroll(-scrollSpeed);
      } else if (isNearBottom) {
        const distanceFromBottomThreshold = activeItemY - bottomThreshold;
        const scrollSpeed = normalizeWorklet(
          distanceFromBottomThreshold,
          0,
          AUTOSCROLL_THRESHOLD,
          AUTOSCROLL_MIN_SPEED,
          AUTOSCROLL_MAX_SPEED
        );
        autoscroll(scrollSpeed);
      }
    }
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
    <AnimatedFlatList
      CellRendererComponent={DraggableFlatListCellRenderer}
      data={data}
      onScroll={scrollHandler}
      onLayout={event => {
        visibleHeight.value = event.nativeEvent.layout.height;
      }}
      onContentSizeChange={(_, height) => {
        contentHeight.value = height;
      }}
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
      viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      // eslint-disable-next-line react/jsx-props-no-spreading, @typescript-eslint/no-explicit-any
      {...(otherProps as any)}
    />
  );
};

export const DraggableFlatListCellRenderer = function DraggableFlatListCellRenderer<ItemT extends { id: UniqueIdentifier }>(
  props: CellRendererProps<ItemT>
) {
  const { item, children, ...otherProps } = props;
  return (
    <Draggable activationDelay={200} activeScale={1.025} dragDirection="y" id={item.id.toString()} {...otherProps}>
      {children}
    </Draggable>
  );
};
