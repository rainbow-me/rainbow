import { useAnimatedReaction } from 'react-native-reanimated';
import { useDndContext } from '../DndContext';
import type { UniqueIdentifier } from '../types';

export const useActiveDropReaction = (id: UniqueIdentifier, callback: (isActive: boolean) => void) => {
  const { droppableActiveId: activeId } = useDndContext();
  useAnimatedReaction(
    () => activeId.value === id,
    (next, prev) => {
      if (next !== prev) {
        callback(next);
      }
    },
    []
  );
};
