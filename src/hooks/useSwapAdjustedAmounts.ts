import { Trade } from '@uniswap/sdk';
import { useSelector } from 'react-redux';
import {
  computeSlippageAdjustedAmounts,
  Field,
} from '@rainbow-me/handlers/uniswap';
import { AppState } from '@rainbow-me/redux/store';
import { SwapModalField } from '@rainbow-me/redux/swap';
import { updatePrecisionToDisplay } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapAdjustedAmounts(tradeDetails: Trade) {
  const inputCurrency = useSelector(
    (state: AppState) => state.swap.inputCurrency
  );
  const outputCurrency = useSelector(
    (state: AppState) => state.swap.outputCurrency
  );
  const inputAsExact = useSelector(
    (state: AppState) => state.swap.independentField !== SwapModalField.output
  );
  const nativeCurrency = useSelector(
    (state: AppState) => state.settings.nativeCurrency
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
  const priceValue = ethereumUtils.getAssetPrice({ address, nativeCurrency });
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
