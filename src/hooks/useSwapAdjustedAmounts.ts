import { Trade } from '@uniswap/sdk';
import { useSelector } from 'react-redux';
import {
  computeSlippageAdjustedAmounts,
  Field,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/uniswap' ... Remove this comment to see the full error message
} from '@rainbow-me/handlers/uniswap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import { AppState } from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/swap' or its... Remove this comment to see the full error message
import { SwapModalField } from '@rainbow-me/redux/swap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { updatePrecisionToDisplay } from '@rainbow-me/utilities';

export default function useSwapAdjustedAmounts(tradeDetails: Trade) {
  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );
  const inputCurrency = useSelector(
    (state: AppState) => state.swap.inputCurrency
  );
  const outputCurrency = useSelector(
    (state: AppState) => state.swap.outputCurrency
  );
  const inputAsExact = useSelector(
    (state: AppState) => state.swap.independentField !== SwapModalField.output
  );
  const slippageInBips = useSelector(
    (state: AppState) => state.swap.slippageInBips
  );
  const receivedSoldLabel = inputAsExact ? 'Minimum received' : 'Maximum sold';
  const adjustedAmounts = computeSlippageAdjustedAmounts(
    tradeDetails,
    slippageInBips
  );
  const amountReceivedSold = inputAsExact
    ? adjustedAmounts[Field.OUTPUT]?.toExact()
    : adjustedAmounts[Field.INPUT]?.toExact();
  const address = inputAsExact ? outputCurrency.address : inputCurrency.address;
  const priceValue = genericAssets[address]?.price?.value ?? 0;
  const amountReceivedSoldDisplay = updatePrecisionToDisplay(
    amountReceivedSold,
    priceValue,
    !inputAsExact
  );

  return {
    amountReceivedSold: amountReceivedSoldDisplay,
    receivedSoldLabel,
  };
}
