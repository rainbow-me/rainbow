import { type ViewStyle } from 'react-native';

import { useAnimatedStyle } from 'react-native-reanimated';

import { useDndContext } from '../DndContext';
import type { UniqueIdentifier } from '../types/common';

export type UseDraggableStyleCallback<StyleT extends ViewStyle> = (_: {
  isActive: boolean;
  isDisabled: boolean;
  isActing: boolean;
}) => StyleT;

export const useDraggableStyle = <StyleT extends ViewStyle>(id: UniqueIdentifier, callback: UseDraggableStyleCallback<StyleT>) => {
  const { draggableStates: states, draggableActiveId: activeId, draggableOptions: options } = useDndContext();
  const state = states.value[id];
  return useAnimatedStyle<StyleT>(() => {
    const isActive = activeId.value === id;
    const isActing = state?.value === 'acting';
    const isDisabled = !options.value[id]?.disabled;
    return callback({ isActive, isActing, isDisabled });
  }, [id, state]);
};
