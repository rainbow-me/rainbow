import { useSelector } from 'react-redux';
import {
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';

export default function useUniswapCurrencyReserves() {
  const uniswapAllowances = useSelector(
    ({ uniswap: { inputReserve, outputReserve } }) => ({
      inputReserve,
      outputReserve,
    })
  );
  return {
    uniswapClearCurrenciesAndReserves,
    uniswapUpdateInputCurrency,
    uniswapUpdateOutputCurrency,
    ...uniswapAllowances,
  };
}
