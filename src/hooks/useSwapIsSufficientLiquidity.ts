import { Trade } from '@uniswap/sdk';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import { AppState } from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { greaterThan } from '@rainbow-me/utilities';

export default function useSwapIsSufficientLiquidity(
  doneLoadingReserves: boolean,
  tradeDetails: Trade | null
) {
  const independentValue = useSelector(
    (state: AppState) => state.swap.independentValue
  );
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );
  const outputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.outputCurrency?.address
  );

  return useMemo(() => {
    const noRoute = !tradeDetails?.route;
    const hasUserInput = greaterThan(independentValue, 0);
    const userHasSpecifiedInputOutput =
      inputCurrencyAddress && outputCurrencyAddress && hasUserInput;
    return !(doneLoadingReserves && noRoute && userHasSpecifiedInputOutput);
  }, [
    doneLoadingReserves,
    independentValue,
    inputCurrencyAddress,
    outputCurrencyAddress,
    tradeDetails,
  ]);
}
