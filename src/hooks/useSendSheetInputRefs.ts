import { useRef } from 'react';
import { TextInput } from 'react-native';
import useMagicAutofocus from './useMagicAutofocus';

export default function useSendSheetInputRefs() {
  const assetInputRef = useRef<TextInput>();
  const nativeCurrencyInputRef = useRef<TextInput>();

  const { handleFocus, lastFocusedInputHandle, setLastFocusedInputHandle } = useMagicAutofocus(nativeCurrencyInputRef, null, true);

  return {
    assetInputRef,
    handleFocus,
    lastFocusedInputHandle,
    nativeCurrencyInputRef,
    setLastFocusedInputHandle,
  };
}
