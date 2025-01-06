import { LayoutRectangle } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useDndContext } from '../../../DndContext';
import type { UniqueIdentifier } from '../../../types';
import { applyOffset, arraysEqual, type Direction, doesOverlapOnAxis, moveArrayIndex, type Rectangle } from '../../../utils';
import { useCallback } from 'react';

export type ShouldSwapWorklet = (activeLayout: Rectangle, itemLayout: Rectangle, direction: Direction) => boolean;

export type UseDraggableSortOptions = {
  childrenIds: UniqueIdentifier[];
  horizontal?: boolean;
  onOrderChange?: (order: UniqueIdentifier[]) => void;
  onOrderUpdate?: (nextOrder: UniqueIdentifier[], prevOrder: UniqueIdentifier[]) => void;
  onOrderUpdateWorklet?: (nextOrder: UniqueIdentifier[], prevOrder: UniqueIdentifier[]) => void;
  shouldSwapWorklet?: ShouldSwapWorklet;
};

export const useDraggableSort = ({
  horizontal = false,
  childrenIds,
  onOrderChange,
  onOrderUpdate,
  onOrderUpdateWorklet,
  shouldSwapWorklet = doesOverlapOnAxis,
}: UseDraggableSortOptions) => {
  const { draggableActiveId, draggableStates, draggableRestingOffsets, draggableActiveLayout, draggableOffsets, draggableLayouts } =
    useDndContext();
  const direction = horizontal ? 'horizontal' : 'vertical';

  const draggablePlaceholderIndex = useSharedValue(-1);
  const draggableLastOrder = useSharedValue<UniqueIdentifier[]>(childrenIds);
  const draggableSortOrder = useSharedValue<UniqueIdentifier[]>(childrenIds);

  // Core placeholder index logic
  const findPlaceholderIndex = (activeLayout: LayoutRectangle): number => {
    'worklet';
    const { value: activeId } = draggableActiveId;
    const { value: layouts } = draggableLayouts;
    const { value: offsets } = draggableOffsets;
    const { value: sortOrder } = draggableSortOrder;
    const activeIndex = sortOrder.findIndex(id => id === activeId);
    for (let itemIndex = 0; itemIndex < sortOrder.length; itemIndex++) {
      const itemId = sortOrder[itemIndex];
      if (itemId === activeId) {
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!layouts[itemId]) {
        console.warn(`Unexpected missing layout ${itemId} in layouts!`);
        continue;
      }
      const itemLayout = applyOffset(layouts[itemId].value, {
        x: offsets[itemId].x.value,
        y: offsets[itemId].y.value,
      });

      if (shouldSwapWorklet(activeLayout, itemLayout, direction)) {
        return itemIndex;
      }
    }
    // Fallback to current index
    return activeIndex;
  };

  const resetOffsets = useCallback(() => {
    'worklet';
    requestAnimationFrame(() => {
      const axis = horizontal ? 'x' : 'y';
      const { value: states } = draggableStates;
      const { value: offsets } = draggableOffsets;
      const { value: restingOffsets } = draggableRestingOffsets;
      const { value: sortOrder } = draggableSortOrder;

      for (const itemId of sortOrder) {
        // Can happen if we are asked to refresh the offsets before the layouts are available
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!offsets[itemId]) {
          continue;
        }

        // required to prevent item from animating to its new position
        states[itemId].value = 'sleeping';
        restingOffsets[itemId][axis].value = 0;
        offsets[itemId][axis].value = 0;
      }
      requestAnimationFrame(() => {
        for (const itemId of sortOrder) {
          // Can happen if we are asked to refresh the offsets before the layouts are available
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!offsets[itemId]) {
            continue;
          }
          states[itemId].value = 'resting';
        }
      });
    });
  }, [draggableOffsets, draggableRestingOffsets, draggableSortOrder, draggableStates, horizontal]);

  // Track added/removed draggable items and update the sort order
  useAnimatedReaction(
    () => childrenIds,
    (next, prev) => {
      if (prev === null || prev.length === 0) return;

      if (prev.length === next.length) return;

      // this assumes the order is sorted in the layout, which might not be the case
      // if it's not, would need to sort based on the layout but requires waiting for requestAnimationFrame
      draggableSortOrder.value = next;

      resetOffsets();
    },
    [childrenIds]
  );

  // Track active layout changes and update the placeholder index
  useAnimatedReaction(
    () => [draggableActiveId.value, draggableActiveLayout.value] as const,
    ([nextActiveId, nextActiveLayout], prev) => {
      // Ignore initial reaction
      if (prev === null) {
        return;
      }
      // No active layout
      if (nextActiveLayout === null) {
        return;
      }
      // Reset the placeholder index when the active id changes
      if (nextActiveId === null) {
        draggablePlaceholderIndex.value = -1;
        return;
      }
      // Only track our own children
      if (!childrenIds.includes(nextActiveId)) {
        return;
      }
      // const axis = direction === "row" ? "x" : "y";
      // const delta = prevActiveLayout !== null ? nextActiveLayout[axis] - prevActiveLayout[axis] : 0;
      draggablePlaceholderIndex.value = findPlaceholderIndex(nextActiveLayout);
    },
    [childrenIds]
  );

  // Track placeholder index changes and update the sort order
  useAnimatedReaction(
    () => [draggableActiveId.value, draggablePlaceholderIndex.value] as const,
    (next, prev) => {
      // Ignore initial reaction
      if (prev === null) {
        return;
      }
      const [_prevActiveId, prevPlaceholderIndex] = prev;
      const [nextActiveId, nextPlaceholderIndex] = next;
      const { value: prevOrder } = draggableSortOrder;
      // if (nextPlaceholderIndex !== prevPlaceholderIndex) {
      //   console.log(`Placeholder index changed from ${prevPlaceholderIndex} to ${nextPlaceholderIndex}`);
      // }
      if (prevPlaceholderIndex !== -1 && nextPlaceholderIndex === -1) {
        // Notify the parent component of the order change
        if (nextActiveId === null && onOrderChange) {
          if (!arraysEqual(prevOrder, draggableLastOrder.value)) {
            runOnJS(onOrderChange)(prevOrder);
          }
          draggableLastOrder.value = prevOrder;
        }
      }
      // Only update the sort order when the placeholder index changes between two valid values
      if (prevPlaceholderIndex === -1 || nextPlaceholderIndex === -1) {
        return;
      }
      // Finally update the sort order
      const nextOrder = moveArrayIndex(prevOrder, prevPlaceholderIndex, nextPlaceholderIndex);
      // Notify the parent component of the order update
      if (prevPlaceholderIndex !== nextPlaceholderIndex && nextActiveId !== null) {
        if (onOrderUpdate) {
          runOnJS(onOrderUpdate)(nextOrder, prevOrder);
        }
        onOrderUpdateWorklet?.(nextOrder, prevOrder);
      }

      draggableSortOrder.value = nextOrder;
    },
    [onOrderChange]
  );

  return { draggablePlaceholderIndex, draggableSortOrder };
};
