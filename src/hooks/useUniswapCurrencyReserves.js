import { useSelector } from 'react-redux';

export default function useUniswapCurrencyReserves() {
  const uniswapReserves = useSelector(
    ({ uniswap: { inputReserve, outputReserve } }) => ({
      inputReserve,
      outputReserve,
    })
  );

  return {
    ...uniswapReserves,
  };
}
