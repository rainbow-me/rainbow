import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

export default function useInteraction() {
  const interactionHandle = useRef();

  const createInteractionHandle = useCallback(callback => {
    interactionHandle.current = callback
      ? InteractionManager.runAfterInteractions(callback)
      : InteractionManager.createInteractionHandle();
  }, []);

  const removeInteractionHandle = useCallback(() => {
    if (interactionHandle.current) {
      InteractionManager.clearInteractionHandle(interactionHandle.current);
      interactionHandle.current = null;
    }
  }, []);

  useEffect(() => () => removeInteractionHandle());

  return [createInteractionHandle, removeInteractionHandle, interactionHandle];
}
