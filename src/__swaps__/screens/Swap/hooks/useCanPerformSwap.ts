import { lessThanOrEqualToWorklet, toScaledIntegerWorklet } from '@/__swaps__/safe-math/SafeMath';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { GasSettings } from './useCustomGas';

export function useCanPerformSwap({
  quote,
  inputAsset,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
}) {
  const gasSettings = useSharedValue<GasSettings | undefined>(undefined);
  const estimatedGasLimit = useSharedValue<string | undefined>(undefined);
  const enoughFundsForGas = useSharedValue<boolean>(true);

  const enoughFundsForSwap = useDerivedValue(() => {
    if (!quote.value || 'error' in quote.value || !inputAsset.value) return true;
    return lessThanOrEqualToWorklet(
      quote.value.sellAmount.toString(),
      toScaledIntegerWorklet(inputAsset.value.balance.amount, inputAsset.value.decimals)
    );
  });

  return {
    gasSettings,
    estimatedGasLimit,
    enoughFundsForGas,
    enoughFundsForSwap,
  };
}
