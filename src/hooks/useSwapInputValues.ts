import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { AppState } from '@rainbow-me/redux/store';
import { SwapAmount, updateIsSufficientBalance } from '@rainbow-me/redux/swap';

const isMaxSelector = (state: AppState) => state.swap.isMax;
const inputAmountSelector = (state: AppState) => state.swap.inputAmount;
const inputAsExactAmountSelector = (state: AppState) =>
  state.swap.inputAsExactAmount;
const isSufficientBalanceSelector = (state: AppState) =>
  state.swap.isSufficientBalance;
const nativeAmountSelector = (state: AppState) => state.swap.nativeAmount;
const outputAmountSelector = (state: AppState) => state.swap.outputAmount;

const withSwapInputValues = (
  isMax: boolean,
  inputAmount: SwapAmount,
  inputAsExactAmount: boolean,
  isSufficientBalance: boolean,
  nativeAmount: string,
  outputAmount: SwapAmount
) => {
  return {
    inputAmount: inputAmount?.value,
    inputAmountDisplay: inputAmount?.display,
    inputAsExactAmount,
    isMax,
    isSufficientBalance,
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
    isSufficientBalanceSelector,
    nativeAmountSelector,
    outputAmountSelector,
  ],
  withSwapInputValues
);

export default function useSwapInputValues() {
  const dispatch = useDispatch();
  const inputValues = useSelector(swapInputValuesSelector);
  const swapUpdateIsSufficientBalance = useCallback(
    isSufficientBalance => {
      dispatch(updateIsSufficientBalance(isSufficientBalance));
    },
    [dispatch]
  );
  return {
    ...inputValues,
    swapUpdateIsSufficientBalance,
  };
}
