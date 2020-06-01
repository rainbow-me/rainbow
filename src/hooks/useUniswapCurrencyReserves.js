import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';

export default function useUniswapCurrencyReserves() {
  const dispatch = useDispatch();

  const uniswapReserves = useSelector(
    ({
      uniswap: {
        inputReserve,
        outputReserve,
        inputTokenV2,
        outputTokenV2,
        inputOutputPairV2,
      },
    }) => ({
      inputOutputPairV2,
      inputReserve,
      inputTokenV2,
      outputReserve,
      outputTokenV2,
    })
  );

  const clearUniswapCurrenciesAndReserves = useCallback(
    () => dispatch(uniswapClearCurrenciesAndReserves()),
    [dispatch]
  );

  const updateUniswapInputCurrency = useCallback(
    data =>
      dispatch(uniswapUpdateInputCurrency(data, uniswapReserves.outputTokenV2)),
    [dispatch, uniswapReserves.outputTokenV2]
  );

  const updateUniswapOutputCurrency = useCallback(
    data =>
      dispatch(uniswapUpdateOutputCurrency(data, uniswapReserves.inputTokenV2)),
    [dispatch, uniswapReserves.inputTokenV2]
  );

  return {
    clearUniswapCurrenciesAndReserves,
    updateUniswapInputCurrency,
    updateUniswapOutputCurrency,
    ...uniswapReserves,
  };
}
