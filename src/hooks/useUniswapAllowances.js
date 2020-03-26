import { useSelector } from 'react-redux';
import {
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateAllowances,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';

export default function useUniswapAllowances() {
  const uniswapAllowances = useSelector(
    ({ uniswap: { allowances, inputReserve, outputReserve } }) => ({
      allowances,
      inputReserve,
      outputReserve,
    })
  );
  return {
    uniswapClearCurrenciesAndReserves,
    uniswapUpdateAllowances,
    uniswapUpdateInputCurrency,
    uniswapUpdateOutputCurrency,
    ...uniswapAllowances,
  };
}
