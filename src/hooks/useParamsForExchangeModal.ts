import {
  SwapModalField,
  updateSwapSlippage,
  updateSwapSource,
} from '@/redux/swap';
import { useEffect, useState } from 'react';
import { useSwapInputHandlers } from '@/hooks/index';
import { SwapMetadata } from '@/raps/common';
import { useDispatch } from 'react-redux';
import { useRoute } from '@react-navigation/core';

export default function () {
  const {
    params: { meta },
  } = useRoute<{
    key: string;
    name: string;
    params: { meta?: SwapMetadata };
  }>();
  const dispatch = useDispatch();

  const {
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  } = useSwapInputHandlers();

  const [isFillingParams, setIsFillingParams] = useState(false);

  useEffect(() => {
    if (meta) {
      setIsFillingParams(true);
      if (meta.independentField === SwapModalField.output) {
        updateOutputAmount(meta.independentValue);
      } else if (meta.independentField === SwapModalField.input) {
        updateInputAmount(meta.independentValue);
      } else if (meta.independentField === SwapModalField.native) {
        updateNativeAmount(meta.independentValue);
      }
      dispatch(updateSwapSource(meta.route));
      dispatch(updateSwapSlippage(meta.slippage));
      setTimeout(() => {
        setIsFillingParams(false);
      }, 1000);
    }
  }, [
    dispatch,
    meta,
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  ]);
  return isFillingParams;
}
