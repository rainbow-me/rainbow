import { useSelector } from 'react-redux';
import { UniswapCurrency } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';

export default function useSwapCurrencies() {
  const inputCurrency: UniswapCurrency = useSelector(
    (state: AppState) => state.swap.inputCurrency
  );
  const outputCurrency: UniswapCurrency = useSelector(
    (state: AppState) => state.swap.outputCurrency
  );

  return {
    inputCurrency,
    outputCurrency,
  };
}
