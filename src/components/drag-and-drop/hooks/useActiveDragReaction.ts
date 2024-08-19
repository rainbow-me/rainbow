import { State } from 'react-native-gesture-handler';
import { useAnimatedReaction } from 'react-native-reanimated';
import { useDndContext } from '../DndContext';
import type { UniqueIdentifier } from '../types';

export const useActiveDragReaction = (id: UniqueIdentifier, callback: (isActive: boolean) => void) => {
  const { draggableActiveId: activeId, panGestureState } = useDndContext();
  useAnimatedReaction(
    () => activeId.value === id && ([State.BEGAN, State.ACTIVE] as State[]).includes(panGestureState.value),
    (next, prev) => {
      if (next !== prev) {
        callback(next);
      }
    },
    []
  );
};
