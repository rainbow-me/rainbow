import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { AppState } from '@rainbow-me/redux/store';
import { SwapAmount, swapClearState } from '@rainbow-me/redux/swap';

const isMaxSelector = (state: AppState) => state.swap.isMax;
const inputAmountSelector = (state: AppState) => state.swap.inputAmount;
const inputAsExactAmountSelector = (state: AppState) =>
  state.swap.inputAsExactAmount;
const nativeAmountSelector = (state: AppState) => state.swap.nativeAmount;
const outputAmountSelector = (state: AppState) => state.swap.outputAmount;

const withSwapInputValues = (
  isMax: boolean,
  inputAmount: SwapAmount,
  inputAsExactAmount: boolean,
  nativeAmount: string,
  outputAmount: SwapAmount
) => {
  return {
    inputAmount: inputAmount?.value,
    inputAmountDisplay: inputAmount?.display,
    inputAsExactAmount,
    isMax,
    nativeAmount,
    outputAmount: outputAmount?.value,
    outputAmountDisplay: outputAmount?.display,
  };
};

const swapInputValuesSelector = createSelector(
  [
    isMaxSelector,
    inputAmountSelector,
    inputAsExactAmountSelector,
    nativeAmountSelector,
    outputAmountSelector,
  ],
  withSwapInputValues
);

export default function useSwapInputValues({
  skipClearing,
}: { skipClearing?: boolean } = {}) {
  const dispatch = useDispatch();
  const inputValues = useSelector(swapInputValuesSelector);
  useEffect(() => {
    return () => {
      !skipClearing && dispatch(swapClearState());
    };
  }, [dispatch, skipClearing]);
  return inputValues;
}
