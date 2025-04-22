import { analytics } from '@/analytics';
import { EventProperties } from '@/analytics/event';
import { RapSwapActionParameters } from '@/raps/references';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { SwapsParams } from '../screens/Swap/navigateToSwaps';

type SwapEventTypes = typeof analytics.event.swapsSubmitted | typeof analytics.event.swapsFailed;

type SwapEventParameters<T extends SwapEventTypes> = {
  isHardwareWallet: boolean;
  parameters: Omit<RapSwapActionParameters<'swap' | 'crosschainSwap'>, 'gasFeeParamsBySpeed' | 'gasParams' | 'selectedGasFee'>;
  quickBuyMetadata: SwapsParams['quickBuyMetadata'];
  type: 'crosschainSwap' | 'swap';
} & (T extends typeof analytics.event.swapsSubmitted
  ? {
      errorMessage?: undefined;
    }
  : {
      errorMessage: string;
    });

export function trackSwapEvent<T extends SwapEventTypes>(
  event: T,
  { errorMessage, isHardwareWallet, parameters, quickBuyMetadata, type }: SwapEventParameters<T>
): void {
  const { degenMode, inputAsset, lastNavigatedTrendingToken, outputAsset } = useSwapsStore.getState();
  const isBridge =
    !!inputAsset?.networks && !!inputAsset.chainId && inputAsset.networks[inputAsset.chainId]?.address === outputAsset?.address;

  const isSwappingToPopularAsset = outputAsset?.sectionId === 'popular';
  const isSwappingToTrendingAsset =
    lastNavigatedTrendingToken === parameters.assetToBuy.uniqueId || lastNavigatedTrendingToken === parameters.assetToSell.uniqueId;

  const {
    address: inputAssetAddress = '',
    chainId: inputAssetChainId = ChainId.mainnet,
    name: inputAssetName = '',
    symbol: inputAssetSymbol = '',
    type: inputAssetType = '',
  } = inputAsset || {};

  const {
    address: outputAssetAddress = '',
    chainId: outputAssetChainId = ChainId.mainnet,
    name: outputAssetName = '',
    symbol: outputAssetSymbol = '',
    type: outputAssetType = '',
  } = outputAsset || {};

  const params: EventProperties[T] = {
    degenMode,
    errorMessage: errorMessage ?? null,
    inputAssetAddress,
    inputAssetAmount: Number(parameters.quote.sellAmount),
    inputAssetChainId,
    inputAssetName,
    inputAssetSymbol,
    inputAssetType,
    isBridge,
    isHardwareWallet,
    isSwappingToPopularAsset,
    isSwappingToTrendingAsset,
    mainnetAddress:
      parameters.assetToBuy.chainId === ChainId.mainnet ? parameters.assetToBuy.address : parameters.assetToSell.mainnetAddress,
    outputAssetAddress,
    outputAssetAmount: Number(parameters.quote.buyAmount),
    outputAssetChainId,
    outputAssetName,
    outputAssetSymbol,
    outputAssetType,
    quickBuyMetadata: quickBuyMetadata?.outputAssetUniqueId === outputAsset?.uniqueId ? quickBuyMetadata : undefined,
    tradeAmountUSD: parameters.quote.tradeAmountUSD,
    type,
  };

  analytics.track(event, params);
}
