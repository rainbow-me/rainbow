import { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import useMagicAutofocus from './useMagicAutofocus';

export default function useFeesPanelInputRefs() {
  const maxBaseFeeFieldRef = useRef<TextInput>();
  const minerTipFieldRef = useRef<TextInput>();

  const findNextInput = useCallback(currentFocusedInputHandle => {
    const maxBaseFeetRefHandle = maxBaseFeeFieldRef.current;
    const minerTipRefHandle = minerTipFieldRef.current;

    const lastFocusedIsMaxBaseFeeType =
      currentFocusedInputHandle?.current === maxBaseFeetRefHandle;

    const lastFocusedIsMinerTipType =
      currentFocusedInputHandle?.current === minerTipRefHandle;

    if (lastFocusedIsMaxBaseFeeType) {
      return maxBaseFeetRefHandle;
    }

    if (lastFocusedIsMinerTipType) {
      return minerTipRefHandle;
    }

    return currentFocusedInputHandle.current;
  }, []);

  const {
    handleFocus,
    lastFocusedInputHandle,
    setLastFocusedInputHandle,
  } = useMagicAutofocus(maxBaseFeeFieldRef, findNextInput, true);

  return {
    handleFocus,
    lastFocusedInputHandle,
    maxBaseFeeFieldRef,
    minerTipFieldRef,
    setLastFocusedInputHandle,
  };
}
