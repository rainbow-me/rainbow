import { useDndContext } from '@/components/drag-and-drop/DndContext';
import { useDraggableSort, type UseDraggableSortOptions } from './useDraggableSort';
import Animated, { AnimatedRef, SharedValue, scrollTo, useAnimatedReaction } from 'react-native-reanimated';
import { applyOffset, doesOverlapOnAxis } from '@/components/drag-and-drop/utils';
import { useCallback } from 'react';

const AUTOSCROLL_THRESHOLD = 50;
const AUTOSCROLL_MIN_SPEED = 1;
const AUTOSCROLL_MAX_SPEED = 3;
const AUTOSCROLL_THRESHOLD_MAX_DISTANCE = 100;

function normalizeWorklet(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) {
  'worklet';
  return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
}

const canScrollToWorklet = ({
  newOffset,
  contentHeight,
  layoutHeight,
  currentOffset = 0,
}: {
  newOffset: number;
  contentHeight: number;
  layoutHeight: number;
  currentOffset: number;
}) => {
  'worklet';
  const maxOffset = contentHeight - layoutHeight;
  return newOffset >= 0 && newOffset <= maxOffset && newOffset !== currentOffset;
};

export type UseDraggableScrollOptions = Pick<
  UseDraggableSortOptions,
  'childrenIds' | 'onOrderChange' | 'onOrderUpdate' | 'shouldSwapWorklet'
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
    shouldSwapWorklet,
  });

  const direction = horizontal ? 'column' : 'row';
  const size = 1;

  const autoscroll = useCallback(
    (offset: number) => {
      'worklet';
      const smoothedOffset = Math.round(offset);
      const { value: activeId } = draggableActiveId;

      if (activeId) {
        const { value: layouts } = draggableLayouts;
        const { value: offsets } = draggableOffsets;
        const activeLayout = layouts[activeId].value;
        const activeOffset = offsets[activeId];
        const newOffset = scrollOffset.value + smoothedOffset;

        if (
          !canScrollToWorklet({
            newOffset,
            contentHeight: contentHeight.value,
            layoutHeight: layoutHeight.value,
            currentOffset: scrollOffset.value,
          })
        ) {
          return;
        }

        scrollTo(animatedScrollViewRef, 0, newOffset, false);
        activeOffset.y.value += smoothedOffset;
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
        const scrollSpeed = normalizeWorklet(
          distanceFromTopThreshold,
          0,
          AUTOSCROLL_THRESHOLD_MAX_DISTANCE,
          AUTOSCROLL_MIN_SPEED,
          AUTOSCROLL_MAX_SPEED
        );
        autoscroll(-scrollSpeed);
      } else if (isNearBottom) {
        const distanceFromBottomThreshold = activeItemY - bottomThreshold;
        const scrollSpeed = normalizeWorklet(
          distanceFromBottomThreshold,
          0,
          AUTOSCROLL_THRESHOLD_MAX_DISTANCE,
          AUTOSCROLL_MIN_SPEED,
          AUTOSCROLL_MAX_SPEED
        );
        autoscroll(scrollSpeed);
      }
    }
  );
};
