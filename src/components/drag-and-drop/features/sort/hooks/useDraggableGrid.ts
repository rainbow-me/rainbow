import { type FlexStyle } from 'react-native';
import { useAnimatedReaction } from 'react-native-reanimated';
import { doesCenterPointOverlap } from '../../../utils';
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

        switch (direction) {
          case 'row':
            offset.x.value += moveCol * (width + gap);
            offset.y.value += moveRow * (height + gap);
            break;
          case 'row-reverse':
            offset.x.value += -1 * moveCol * (width + gap);
            offset.y.value += moveRow * (height + gap);
            break;
          case 'column':
            offset.y.value += moveCol * (width + gap);
            offset.x.value += moveRow * (height + gap);
            break;
          case 'column-reverse':
            offset.y.value += -1 * moveCol * (width + gap);
            offset.x.value += moveRow * (height + gap);
            break;
          default:
            break;
        }
      }
    },
    [direction, gap, size]
  );

  return { draggablePlaceholderIndex, draggableSortOrder };
};
