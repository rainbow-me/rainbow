import { type ViewStyle } from 'react-native';

import { useAnimatedStyle } from 'react-native-reanimated';

import { useDndContext } from '../DndContext';
import type { UniqueIdentifier } from '../types/common';

export type UseDroppableStyleCallback<StyleT extends ViewStyle> = (_: { isActive: boolean; isDisabled: boolean }) => StyleT;

export const useDroppableStyle = <StyleT extends ViewStyle>(id: UniqueIdentifier, callback: UseDroppableStyleCallback<StyleT>) => {
  const { droppableActiveId: activeId, droppableOptions: options } = useDndContext();
  return useAnimatedStyle<StyleT>(() => {
    const isActive = activeId.value === id;
    const isDisabled = !options.value[id]?.disabled;
    return callback({ isActive, isDisabled });
  }, []);
};
