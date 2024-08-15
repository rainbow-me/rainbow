import { useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useDndContext } from '../DndContext';
import type { UniqueIdentifier } from '../types';

export const useDraggableActiveId = () => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const { draggableActiveId } = useDndContext();
  useAnimatedReaction(
    () => draggableActiveId.value,
    (next, prev) => {
      if (next !== prev) {
        runOnJS(setActiveId)(next);
      }
    },
    []
  );
  return activeId;
};
