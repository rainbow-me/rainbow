import { useDndContext } from '@/components/drag-and-drop/DndContext';
import { useDraggableSort, type UseDraggableSortOptions } from './useDraggableSort';
import Animated, { AnimatedRef, SharedValue, scrollTo, useAnimatedReaction } from 'react-native-reanimated';
import { applyOffset, doesOverlapOnAxis, getFlexLayoutPosition } from '@/components/drag-and-drop/utils';
import { useCallback } from 'react';

const AUTOSCROLL_THRESHOLD = 50;
const AUTOSCROLL_MIN_SPEED = 1;
const AUTOSCROLL_MAX_SPEED = 7;
const AUTOSCROLL_THRESHOLD_MAX_DISTANCE = 100;

function easeInOutCubicWorklet(x: number): number {
  'worklet';
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function getScrollSpeedWorklet(distanceFromThreshold: number): number {
  'worklet';
  const normalizedDistance = Math.min(distanceFromThreshold / AUTOSCROLL_THRESHOLD_MAX_DISTANCE, 1);

  const eased = easeInOutCubicWorklet(normalizedDistance);

  return AUTOSCROLL_MIN_SPEED + (AUTOSCROLL_MAX_SPEED - AUTOSCROLL_MIN_SPEED) * eased;
}

function getRemainingScrollDistanceWorklet({
  newOffset,
  contentHeight,
  layoutHeight,
  currentOffset = 0,
}: {
  newOffset: number;
  contentHeight: number;
  layoutHeight: number;
  currentOffset: number;
}): number {
  'worklet';
  const maxOffset = contentHeight - layoutHeight;

  if (newOffset < 0) {
    // Distance to scroll back to top
    return -currentOffset;
  }

  if (newOffset > maxOffset) {
    // Distance to scroll to bottom
    return maxOffset - currentOffset;
  }

  return newOffset - currentOffset;
}

export type UseDraggableScrollOptions = Pick<
  UseDraggableSortOptions,
  'childrenIds' | 'onOrderChange' | 'onOrderUpdate' | 'onOrderUpdateWorklet' | 'shouldSwapWorklet'
> & {
  contentHeight: SharedValue<number>;
  layoutHeight: SharedValue<number>;
  animatedScrollViewRef: AnimatedRef<Animated.ScrollView>;
  scrollOffset: SharedValue<number>;
  horizontal?: boolean;
  autoScrollInsets?: { top?: number; bottom?: number };
  gap?: number;
};

export const useDraggableScroll = ({
  childrenIds,
  onOrderChange,
  onOrderUpdate,
  onOrderUpdateWorklet,
  shouldSwapWorklet = doesOverlapOnAxis,
  horizontal = false,
  contentHeight,
  layoutHeight,
  autoScrollInsets,
  scrollOffset,
  animatedScrollViewRef,
  gap = 0,
}: UseDraggableScrollOptions) => {
  const { draggableActiveId, draggableLayouts, draggableOffsets, draggableRestingOffsets, draggableActiveLayout } = useDndContext();

  const { draggableSortOrder } = useDraggableSort({
    horizontal,
    childrenIds,
    onOrderChange,
    onOrderUpdate,
    onOrderUpdateWorklet,
    shouldSwapWorklet,
  });

  const direction = horizontal ? 'column' : 'row';
  const size = 1;

  const autoscroll = useCallback(
    (offset: number) => {
      'worklet';
      const { value: activeId } = draggableActiveId;

      if (activeId) {
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        const activeLayout = layouts[activeId].value;
        const activeOffset = offsets[activeId];
        const requestedOffset = scrollOffset.value + offset;

        // ensures we always scroll to the end even if the requested offset would exceed it
        const remainingScrollDistance = getRemainingScrollDistanceWorklet({
          newOffset: requestedOffset,
          contentHeight: contentHeight.value,
          layoutHeight: layoutHeight.value,
          currentOffset: scrollOffset.value,
        });

        if (
          (offset > 0 && remainingScrollDistance < AUTOSCROLL_MIN_SPEED) ||
          (offset < 0 && remainingScrollDistance > -AUTOSCROLL_MIN_SPEED)
        ) {
          return;
        }

        scrollTo(animatedScrollViewRef, 0, scrollOffset.value + remainingScrollDistance, false);
        activeOffset.y.value += remainingScrollDistance;
        draggableActiveLayout.value = applyOffset(activeLayout, {
          x: activeOffset.x.value,
          y: activeOffset.y.value,
        });
      }
    },
    [
      draggableActiveId,
      draggableLayouts,
      draggableOffsets,
      scrollOffset,
      contentHeight,
      layoutHeight,
      animatedScrollViewRef,
      draggableActiveLayout,
    ]
  );

  // TODO: This is a fix to offsets drifting when interacting too quickly that works for useDraggableGrid, but autoscrolling here breaks it
  // useAnimatedReaction(
  //   () => draggableSortOrder.value,
  //   (nextOrder, prevOrder) => {
  //     if (prevOrder === null) return;

  //     const { value: activeId } = draggableActiveId;
  //     const { value: layouts } = draggableLayouts;
  //     const { value: offsets } = draggableOffsets;
  //     const { value: restingOffsets } = draggableRestingOffsets;

  //     if (!activeId) return;

  //     const activeLayout = layouts[activeId].value;
  //     const { width, height } = activeLayout;

  //     for (let nextIndex = 0; nextIndex < nextOrder.length; nextIndex++) {
  //       const itemId = nextOrder[nextIndex];
  //       const originalIndex = childrenIds.indexOf(itemId);
  //       const prevIndex = prevOrder.findIndex(id => id === itemId);

  //       if (nextIndex === prevIndex) continue;

  //       const offset = itemId === activeId ? restingOffsets[activeId] : offsets[itemId];

  //       if (!restingOffsets[itemId] || !offsets[itemId]) continue;

  //       const originalPosition = getFlexLayoutPosition({ index: originalIndex, width, height, gap, direction, size });
  //       const newPosition = getFlexLayoutPosition({ index: nextIndex, width, height, gap, direction, size });

  //       if (direction === 'row') {
  //         offset.y.value = newPosition.y - originalPosition.y;
  //       } else if (direction === 'column') {
  //         offset.x.value = newPosition.x - originalPosition.x;
  //       }
  //     }
  //   },
  //   [direction, gap, size, childrenIds]
  // );

  useAnimatedReaction(
    () => draggableSortOrder.value,
    (nextOrder, prevOrder) => {
      if (prevOrder === null) return;

      const { value: activeId } = draggableActiveId;
      const { value: layouts } = draggableLayouts;
      const { value: offsets } = draggableOffsets;
      const { value: restingOffsets } = draggableRestingOffsets;

      if (!activeId) return;

      const activeLayout = layouts[activeId].value;
      const { width, height } = activeLayout;
      const restingOffset = restingOffsets[activeId];

      for (let nextIndex = 0; nextIndex < nextOrder.length; nextIndex++) {
        const itemId = nextOrder[nextIndex];
        const prevIndex = prevOrder.findIndex(id => id === itemId);
        if (nextIndex === prevIndex) continue;

        const prevRow = Math.floor(prevIndex / size);
        const prevCol = prevIndex % size;
        const nextRow = Math.floor(nextIndex / size);
        const nextCol = nextIndex % size;
        const moveCol = nextCol - prevCol;
        const moveRow = nextRow - prevRow;

        const offset = itemId === activeId ? restingOffset : offsets[itemId];
        if (!restingOffset || !offsets[itemId]) continue;

        switch (direction) {
          case 'row':
            offset.y.value += moveRow * (height + gap);
            break;
          case 'column':
            offset.x.value += moveCol * (width + gap);
            break;
        }
      }
    },
    []
  );

  // React to active item position and autoscroll if necessary
  useAnimatedReaction(
    () => draggableActiveLayout.value?.y,
    activeItemY => {
      if (activeItemY === undefined) return;

      const bottomThreshold = scrollOffset.value + layoutHeight.value - AUTOSCROLL_THRESHOLD - (autoScrollInsets?.bottom ?? 0);
      const isNearBottom = activeItemY >= bottomThreshold;

      const topThreshold = scrollOffset.value + AUTOSCROLL_THRESHOLD + (autoScrollInsets?.top ?? 0);
      const isNearTop = activeItemY <= topThreshold;

      if (isNearTop) {
        const distanceFromTopThreshold = topThreshold - activeItemY;
        const scrollSpeed = getScrollSpeedWorklet(distanceFromTopThreshold);
        autoscroll(-scrollSpeed);
      } else if (isNearBottom) {
        const distanceFromBottomThreshold = activeItemY - bottomThreshold;
        const scrollSpeed = getScrollSpeedWorklet(distanceFromBottomThreshold);
        autoscroll(scrollSpeed);
      }
    }
  );
};
