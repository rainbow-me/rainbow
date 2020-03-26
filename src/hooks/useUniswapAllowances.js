import { useSelector } from 'react-redux';
import {
  uniswapClearCurrenciesAndReserves,
  uniswapUpdateAllowances,
  uniswapUpdateInputCurrency,
  uniswapUpdateOutputCurrency,
} from '../redux/uniswap';

export default function useUniswapAllowances() {
  const uniswapAllowances = useSelector(
    ({
      uniswap: { allowances, inputReserve, outputReserve, tokenReserves },
    }) => ({
      allowances,
      inputReserve,
      outputReserve,
      tokenReserves,
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
