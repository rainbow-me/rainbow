import { useSelector } from 'react-redux';
import { Asset } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';

export default function useSwapInputOutputTokens() {
  const inputCurrency: Asset = useSelector(
    (state: AppState) => state.swap.inputCurrency
  );
  const outputCurrency: Asset = useSelector(
    (state: AppState) => state.swap.outputCurrency
  );

  return {
    inputCurrency,
    outputCurrency,
  };
}
