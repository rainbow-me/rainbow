import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import { greaterThan } from '@rainbow-me/utilities';

export default function useSwapIsSufficientLiquidity() {
  const inputAsExactAmount = useSelector(
    (state: AppState) => state.swap.inputAsExactAmount
  );
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );
  const outputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.outputCurrency?.address
  );
  const inputAmount = useSelector(
    (state: AppState) => state.swap.inputAmount?.value
  );
  const outputAmount = useSelector(
    (state: AppState) => state.swap.inputAmount?.value
  );
  const trade = useSelector((state: AppState) => state.swap.tradeDetails);

  const isSufficientLiquidity = useMemo(() => {
    const noRoute = !trade?.route;
    const hasSpecifiedField = inputAsExactAmount
      ? greaterThan(inputAmount, 0)
      : greaterThan(outputAmount, 0);
    const userHasSpecifiedInputOutput =
      inputCurrencyAddress && outputCurrencyAddress && hasSpecifiedField;
    return !(noRoute && userHasSpecifiedInputOutput);
  }, [
    inputAmount,
    inputAsExactAmount,
    inputCurrencyAddress,
    outputAmount,
    outputCurrencyAddress,
    trade,
  ]);

  return isSufficientLiquidity;
}
