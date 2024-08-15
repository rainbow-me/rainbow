import { LayoutRectangle } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useDndContext } from '../../../DndContext';
import type { UniqueIdentifier } from '../../../types';
import { applyOffset, arraysEqual, centerAxis, moveArrayIndex, overlapsAxis, type Rectangle } from '../../../utils';

export type ShouldSwapWorklet = (activeLayout: Rectangle, itemLayout: Rectangle) => boolean;

export type UseDraggableSortOptions = {
  initialOrder?: UniqueIdentifier[];
  horizontal?: boolean;
  onOrderChange?: (order: UniqueIdentifier[]) => void;
  onOrderUpdate?: (nextOrder: UniqueIdentifier[], prevOrder: UniqueIdentifier[]) => void;
  shouldSwapWorklet?: ShouldSwapWorklet;
};

export const useDraggableSort = ({
  horizontal = false,
  initialOrder = [],
  onOrderChange,
  onOrderUpdate,
  shouldSwapWorklet,
}: UseDraggableSortOptions) => {
  const { draggableActiveId, draggableActiveLayout, draggableOffsets, draggableLayouts } = useDndContext();

  const draggablePlaceholderIndex = useSharedValue(-1);
  const draggableLastOrder = useSharedValue<UniqueIdentifier[]>(initialOrder);
  const draggableSortOrder = useSharedValue<UniqueIdentifier[]>(initialOrder);

  // Core placeholder index logic
  const findPlaceholderIndex = (activeLayout: LayoutRectangle): number => {
    'worklet';
    const { value: activeId } = draggableActiveId;
    const { value: layouts } = draggableLayouts;
    const { value: offsets } = draggableOffsets;
    const { value: sortOrder } = draggableSortOrder;
    const activeIndex = sortOrder.findIndex(id => id === activeId);
    // const activeCenterPoint = centerPoint(activeLayout);
    // console.log(`activeLayout: ${JSON.stringify(activeLayout)}`);
    for (let itemIndex = 0; itemIndex < sortOrder.length; itemIndex++) {
      const itemId = sortOrder[itemIndex];
      if (itemId === activeId) {
        continue;
      }
      if (!layouts[itemId]) {
        console.warn(`Unexpected missing layout ${itemId} in layouts!`);
        continue;
      }
      const itemLayout = applyOffset(layouts[itemId].value, {
        x: offsets[itemId].x.value,
        y: offsets[itemId].y.value,
      });

      if (shouldSwapWorklet) {
        if (shouldSwapWorklet(activeLayout, itemLayout)) {
          // console.log(`Found placeholder index ${itemIndex} using custom shouldSwapWorklet!`);
          return itemIndex;
        }
        continue;
      }

      // Default to center axis
      const itemCenterAxis = centerAxis(itemLayout, horizontal);
      if (overlapsAxis(activeLayout, itemCenterAxis, horizontal)) {
        return itemIndex;
      }
    }
    // Fallback to current index
    // console.log(`Fallback to current index ${activeIndex}`);
    return activeIndex;
  };

  // Track active layout changes and update the placeholder index
  useAnimatedReaction(
    () => [draggableActiveId.value, draggableActiveLayout.value] as const,
    ([nextActiveId, nextActiveLayout], prev) => {
      // Ignore initial reaction
      if (prev === null) {
        return;
      }
      // const [_prevActiveId, _prevActiveLayout] = prev;
      // No active layout
      if (nextActiveLayout === null) {
        return;
      }
      // Reset the placeholder index when the active id changes
      if (nextActiveId === null) {
        draggablePlaceholderIndex.value = -1;
        return;
      }
      // const axis = direction === "row" ? "x" : "y";
      // const delta = prevActiveLayout !== null ? nextActiveLayout[axis] - prevActiveLayout[axis] : 0;
      draggablePlaceholderIndex.value = findPlaceholderIndex(nextActiveLayout);
    },
    []
  );

  // Track placeholder index changes and update the sort order
  useAnimatedReaction(
    () => [draggableActiveId.value, draggablePlaceholderIndex.value] as const,
    (next, prev) => {
      // Ignore initial reaction
      if (prev === null) {
        return;
      }
      const [, prevPlaceholderIndex] = prev;
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
      if (onOrderUpdate) {
        runOnJS(onOrderUpdate)(nextOrder, prevOrder);
      }

      draggableSortOrder.value = nextOrder;
    },
    [onOrderChange]
  );

  return { draggablePlaceholderIndex, draggableSortOrder };
};
