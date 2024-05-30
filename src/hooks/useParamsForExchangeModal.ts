import { SwapModalField, updateSwapSlippage, updateSwapSource } from '@/redux/swap';
import { MutableRefObject, useEffect, useState } from 'react';
import { useSwapInputHandlers } from '@/hooks/index';
import { SwapMetadata } from '@/raps/references';
import { useDispatch } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { TextInput } from 'react-native';
import { disable, enable } from '@/hooks/useMagicAutofocus';

// I know this is a bit of dancing with keyboard, sorry!
// Feel free to do it better, I can't.

export default function ({
  inputFieldRef,
  outputFieldRef,
  nativeFieldRef,
}: {
  inputFieldRef: MutableRefObject<TextInput | null>;
  outputFieldRef: MutableRefObject<TextInput | null>;
  nativeFieldRef: MutableRefObject<TextInput | null>;
}) {
  const {
    params: { meta },
  } = useRoute<{
    key: string;
    name: string;
    params: { meta?: SwapMetadata };
  }>();
  const dispatch = useDispatch();

  const { updateInputAmount, updateNativeAmount, updateOutputAmount } = useSwapInputHandlers();

  const [isFillingParams, setIsFillingParams] = useState(false);

  useEffect(() => {
    if (meta) {
      android && disable();
      setIsFillingParams(true);
      if (meta.independentField === SwapModalField.output) {
        updateOutputAmount(meta.independentValue);
        ios &&
          setTimeout(() => {
            outputFieldRef.current?.blur();
            outputFieldRef.current?.focus();
          }, 100);
      } else if (meta.independentField === SwapModalField.input) {
        updateInputAmount(meta.independentValue);
        ios &&
          setTimeout(() => {
            inputFieldRef.current?.blur();
            inputFieldRef.current?.focus();
          }, 100);
      } else if (meta.independentField === SwapModalField.native) {
        updateNativeAmount(meta.independentValue);
        ios &&
          setTimeout(() => {
            nativeFieldRef.current?.blur();
            nativeFieldRef.current?.focus();
          }, 100);
      }
      dispatch(updateSwapSource(meta.route));
      dispatch(updateSwapSlippage(meta.slippage));
      android &&
        setTimeout(() => {
          enable();
          if (meta.independentField === SwapModalField.output) {
            outputFieldRef.current?.focus();
            outputFieldRef.current?.focus();
          } else if (meta.independentField === SwapModalField.input) {
            updateInputAmount(meta.independentValue);
            inputFieldRef.current?.focus();
          } else if (meta.independentField === SwapModalField.native) {
            nativeFieldRef.current?.focus();
          }
        }, 1000);
    }
  }, [dispatch, inputFieldRef, meta, nativeFieldRef, outputFieldRef, updateInputAmount, updateNativeAmount, updateOutputAmount]);
  return isFillingParams;
}
