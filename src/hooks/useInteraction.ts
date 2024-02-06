import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import { Handle, InteractionManager } from 'react-native';

type CreateHandleType = (callback?: () => void) => void;
type RemoveHandleType = () => void;
type HandleType = Handle | null;

export default function useInteraction(): [CreateHandleType, RemoveHandleType, MutableRefObject<HandleType>] {
  const interactionHandle = useRef<HandleType>(null);

  const createInteractionHandle = useCallback<CreateHandleType>(callback => {
    if (callback) {
      InteractionManager.runAfterInteractions(callback);
    } else {
      interactionHandle.current = InteractionManager.createInteractionHandle();
    }
  }, []);

  const removeInteractionHandle = useCallback<RemoveHandleType>(() => {
    if (interactionHandle.current !== null) {
      InteractionManager.clearInteractionHandle(interactionHandle.current);
      interactionHandle.current = null;
    }
  }, []);

  useEffect(() => () => removeInteractionHandle());

  return [createInteractionHandle, removeInteractionHandle, interactionHandle];
}
