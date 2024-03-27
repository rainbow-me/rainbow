import { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import useMagicAutofocus from './useMagicAutofocus';

export default function useFeesPanelInputRefs() {
  const maxBaseFieldRef = useRef<TextInput | null>(null);
  const minerTipFieldRef = useRef<TextInput | null>(null);

  const findNextInput = useCallback((currentFocusedInputHandle: any) => {
    const maxBaseInputRefHandle = maxBaseFieldRef.current;
    const minerTipInputRefHandle = minerTipFieldRef.current;

    const lastFocusedIsMaxBaseType = currentFocusedInputHandle?.current === maxBaseInputRefHandle;

    const lastFocusedIsMinerTipType = currentFocusedInputHandle?.current === minerTipInputRefHandle;

    if (lastFocusedIsMaxBaseType) {
      return maxBaseInputRefHandle;
    }

    if (lastFocusedIsMinerTipType) {
      return minerTipInputRefHandle;
    }

    return currentFocusedInputHandle.current;
  }, []);

  const { handleFocus, lastFocusedInputHandle, setLastFocusedInputHandle, triggerFocus } = useMagicAutofocus(
    maxBaseFieldRef,
    findNextInput,
    false
  );

  return {
    handleFocus,
    lastFocusedInputHandle,
    maxBaseFieldRef,
    minerTipFieldRef,
    setLastFocusedInputHandle,
    triggerFocus,
  };
}
