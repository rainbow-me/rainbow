import { useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { UniswapCurrency } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
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
