import { useCallback } from 'react';
import {
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';
import { useDispatch, useSelector } from '@rainbow-me/react-redux';

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
