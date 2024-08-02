import { useAnimatedStyle } from 'react-native-reanimated';
import { useDndContext } from '..';
import type { AnimatedStyle, UniqueIdentifier } from '../types';

export type UseDroppableStyleCallback<StyleT extends AnimatedStyle> = (_: { isActive: boolean; isDisabled: boolean }) => StyleT;

export const useDroppableStyle = <StyleT extends AnimatedStyle>(
  id: UniqueIdentifier,
  callback: UseDroppableStyleCallback<StyleT>
): StyleT => {
  const { droppableActiveId: activeId, droppableOptions: options } = useDndContext();
  return useAnimatedStyle<StyleT>(() => {
    const isActive = activeId.value === id;
    const isDisabled = !options.value[id]?.disabled;
    return callback({ isActive, isDisabled });
  }, []);
};
