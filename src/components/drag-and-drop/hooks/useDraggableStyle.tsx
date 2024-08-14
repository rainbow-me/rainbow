import { useAnimatedStyle } from 'react-native-reanimated';
import { useDndContext } from '..';
import type { AnimatedStyle, UniqueIdentifier } from '../types';

export type UseDraggableStyleCallback<StyleT extends AnimatedStyle> = (_: {
  isActive: boolean;
  isDisabled: boolean;
  isActing: boolean;
}) => StyleT;

export const useDraggableStyle = <StyleT extends AnimatedStyle>(
  id: UniqueIdentifier,
  callback: UseDraggableStyleCallback<StyleT>
): StyleT => {
  const { draggableStates: states, draggableActiveId: activeId, draggableOptions: options } = useDndContext();
  const state = states.value[id];
  return useAnimatedStyle<StyleT>(() => {
    const isActive = activeId.value === id;
    const isActing = state?.value === 'acting';
    const isDisabled = !options.value[id]?.disabled;
    return callback({ isActive, isActing, isDisabled });
  }, [id, state]);
};
