import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

export default function useInteraction() {
  const interactionHandle = useRef();

  const createInteractionHandle = useCallback(callback => {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'number | { then: (onfulfilled?: (() => any) ... Remove this comment to see the full error message
    interactionHandle.current = callback
      ? InteractionManager.runAfterInteractions(callback)
      : InteractionManager.createInteractionHandle();
  }, []);

  const removeInteractionHandle = useCallback(() => {
    if (interactionHandle.current) {
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
      InteractionManager.clearInteractionHandle(interactionHandle.current);
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'undefined'.
      interactionHandle.current = null;
    }
  }, []);

  useEffect(() => () => removeInteractionHandle());

  return [createInteractionHandle, removeInteractionHandle, interactionHandle];
}
