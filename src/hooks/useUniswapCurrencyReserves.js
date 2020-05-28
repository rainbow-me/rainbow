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
    ({ uniswap: { inputReserve, outputReserve } }) => ({
      inputReserve,
      outputReserve,
    })
  );

  const clearUniswapCurrenciesAndReserves = useCallback(
    () => dispatch(uniswapClearCurrenciesAndReserves()),
    [dispatch]
  );

  const updateUniswapInputCurrency = useCallback(
    data => dispatch(uniswapUpdateInputCurrency(data)),
    [dispatch]
  );

  const updateUniswapOutputCurrency = useCallback(
    data => dispatch(uniswapUpdateOutputCurrency(data)),
    [dispatch]
  );

  return {
    clearUniswapCurrenciesAndReserves,
    updateUniswapInputCurrency,
    updateUniswapOutputCurrency,
    ...uniswapReserves,
  };
}
