import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import { Handle } from 'react-native';

interface UsePressHandlerParams {
  minLongPressDuration: number;
  interactionHandle: MutableRefObject<Handle | null>;
  onLongPress?: () => void;
  onPress: () => void;
  optionallyTriggerHaptic: () => void;
}

export function usePressHandler({
  interactionHandle,
  minLongPressDuration,
  onLongPress,
  onPress,
  optionallyTriggerHaptic,
}: UsePressHandlerParams) {
  const longPressHandle = useRef<NodeJS.Timeout | null>(null);

  const createHandle = useCallback(() => {
    longPressHandle.current = setTimeout(() => {
      onLongPress?.();
      longPressHandle.current = null;
      optionallyTriggerHaptic();
    }, minLongPressDuration);
  }, [minLongPressDuration, onLongPress, optionallyTriggerHaptic]);

  const handlePress = useCallback(() => {
    if (onLongPress && !longPressHandle.current) return;
    onPress?.();
    optionallyTriggerHaptic();
  }, [longPressHandle, onLongPress, onPress, optionallyTriggerHaptic]);

  const removeHandle = useCallback(() => {
    if (interactionHandle.current && longPressHandle.current !== null) {
      clearTimeout(longPressHandle.current);
      longPressHandle.current = null;
    }
  }, [interactionHandle]);

  useEffect(() => () => removeHandle());
  return [handlePress, createHandle, removeHandle];
}
