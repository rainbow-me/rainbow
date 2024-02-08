import { useSelector } from 'react-redux';
import { SwappableAsset } from '@/entities';
import { AppState } from '@/redux/store';

export default function useSwapCurrencies() {
  const inputCurrency: SwappableAsset = useSelector((state: AppState) => state.swap.inputCurrency);
  const outputCurrency: SwappableAsset = useSelector((state: AppState) => state.swap.outputCurrency);

  return {
    inputCurrency,
    outputCurrency,
  };
}
