import { runOnJS } from 'react-native-reanimated';

import { type ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { analytics } from '@/analytics';
import { type EventProperties } from '@/analytics/event';
import { type QuoteError } from '@rainbow-me/swaps';

type QuoteFailureParams = EventProperties[typeof analytics.event.swapsQuoteFailed];

let lastParams: QuoteFailureParams | undefined;

function trackQuoteFailure(params: QuoteFailureParams) {
  if (
    lastParams &&
    params.error_code === lastParams.error_code &&
    params.inputAmount === lastParams.inputAmount &&
    params.outputAmount === lastParams.outputAmount &&
    params.inputAsset.address === lastParams.inputAsset.address &&
    params.outputAsset.address === lastParams.outputAsset.address
  )
    return;

  lastParams = params;
  analytics.track(analytics.event.swapsQuoteFailed, params);
}

export function analyticsTrackQuoteFailed(
  quote: QuoteError | null,
  {
    inputAsset,
    outputAsset,
    inputAmount,
    outputAmount,
  }: {
    inputAsset: ExtendedAnimatedAssetWithColors | null;
    outputAsset: ExtendedAnimatedAssetWithColors | null;
    inputAmount: number | undefined;
    outputAmount: number | undefined;
  }
) {
  'worklet';
  // we are tracking 'Insufficient funds' 'Out of gas' 'No routes found' and 'No quotes found'
  if (!quote || !inputAsset || !outputAsset || !inputAmount) return;

  const params = {
    error_code: quote.error_code,
    reason: quote.message,
    inputAsset: { address: inputAsset.address, chainId: inputAsset.chainId, symbol: inputAsset.symbol },
    outputAsset: { address: outputAsset.address, chainId: outputAsset.chainId, symbol: outputAsset.symbol },
    inputAmount,
    outputAmount,
  };
  runOnJS(trackQuoteFailure)(params);
}
