import { type FlexStyle } from 'react-native';
import { useAnimatedReaction } from 'react-native-reanimated';
import { doesCenterPointOverlap, getFlexLayoutPosition } from '../../../utils';
import { useDndContext } from './../../../DndContext';
import { useDraggableSort, type UseDraggableSortOptions } from './useDraggableSort';

export type UseDraggableGridOptions = Pick<
  UseDraggableSortOptions,
  'childrenIds' | 'onOrderChange' | 'onOrderUpdate' | 'onOrderUpdateWorklet' | 'shouldSwapWorklet'
> & {
  gap?: number;
  size: number;
  direction: FlexStyle['flexDirection'];
};

export const useDraggableGrid = ({
  childrenIds,
  onOrderChange,
  onOrderUpdate,
  onOrderUpdateWorklet,
  gap = 0,
  size,
  direction = 'row',
  shouldSwapWorklet = doesCenterPointOverlap,
}: UseDraggableGridOptions) => {
  const { draggableActiveId, draggableOffsets, draggableRestingOffsets, draggableLayouts } = useDndContext();
  const horizontal = ['row', 'row-reverse'].includes(direction);

  const { draggablePlaceholderIndex, draggableSortOrder } = useDraggableSort({
    horizontal,
    childrenIds,
    onOrderChange,
    onOrderUpdate,
    onOrderUpdateWorklet,
    shouldSwapWorklet,
  });

  // Track sort order changes and update the offsets based on base positions
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

      for (let nextIndex = 0; nextIndex < nextOrder.length; nextIndex++) {
        const itemId = nextOrder[nextIndex];

        const originalIndex = childrenIds.indexOf(itemId);
        const prevIndex = prevOrder.findIndex(id => id === itemId);

        if (nextIndex === prevIndex) continue;

        const offset = itemId === activeId ? restingOffsets[activeId] : offsets[itemId];
        if (!restingOffsets[itemId] || !offsets[itemId]) continue;

        const originalPosition = getFlexLayoutPosition({ index: originalIndex, width, height, gap, direction, size });
        const newPosition = getFlexLayoutPosition({ index: nextIndex, width, height, gap, direction, size });

        // Set offset as the difference between new and original position
        offset.x.value = newPosition.x - originalPosition.x;
        offset.y.value = newPosition.y - originalPosition.y;
      }
    },
    [direction, gap, size, childrenIds]
  );

  return { draggablePlaceholderIndex, draggableSortOrder };
};
