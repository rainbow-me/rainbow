import { formatUnits } from 'viem';
import { MeteorologyResponse, MeteorologyLegacyResponse } from '@/entities/gas';
import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { isCrosschainQuote, isValidQuote } from '@/features/perps/screens/perps-deposit-withdraw-screen/utils';
import { rainbowMeteorologyGetData } from '@/handlers/gasFees';
import { convertAmountToNativeDisplayWorklet, formatNumber, multiply } from '@/helpers/utilities';
import { gweiToWei, weiToGwei } from '@/parsers';
import { estimateUnlockAndCrosschainSwap } from '@/raps/actions/crosschainSwap';
import { gasUnits } from '@/references/gasUnits';
import { FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { QueryStore } from '@/state/internal/queryStore/types';
import { DerivedStore, InferStoreState } from '@/state/internal/types';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { GasSpeed } from '@/__swaps__/types/gas';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';
import { PerpsDepositQuoteStoreType } from './createPerpsDepositQuoteStore';
import { PerpsDepositStoreType, computeMaxSwappableAmount } from './createPerpsDepositStore';

// ============ Types ========================================================== //

type GasLimit = string;
type GasLimitParams = { assetToSellUniqueId: string | null; quoteKey: number | null };

type MeteorologyParams = { chainId: ChainId };
type MeteorologyData = MeteorologyResponse | MeteorologyLegacyResponse;
type MeteorologyActions = { getGasSuggestions: () => GasSuggestions | undefined };

type GasSuggestions = {
  [key in GasSpeed]: key extends GasSpeed.CUSTOM ? GasSettings | undefined : GasSettings;
};

export type PerpsDepositGasStoresType = {
  useGasFeeEstimator: DerivedStore<GasFeeEstimator>;
  useGasLimitStore: QueryStore<GasLimit, GasLimitParams>;
  useGasSettings: DerivedStore<GasSettings | undefined>;
  useMaxSwappableAmount: DerivedStore<string | undefined>;
  useMeteorologyStore: QueryStore<GasSuggestions, MeteorologyParams, MeteorologyActions>;
};

// ============ Gas Stores ===================================================== //

export function createPerpsDepositGasStores(useDepositStore: PerpsDepositStoreType, useQuoteStore: PerpsDepositQuoteStoreType) {
  /**
   * Produces a numeric key each time the `quote` object identity
   * changes to avoid serializing large quote objects as query keys.
   */
  const useQuoteKey = createDerivedStore(
    $ => {
      const quote = $(useQuoteStore).getData();
      if (!isValidQuote(quote)) return null;
      return performance.now();
    },
    { fastMode: true }
  );

  const useMeteorologyStore = createQueryStore<MeteorologyData, MeteorologyParams, MeteorologyActions, GasSuggestions | null>(
    {
      fetcher: fetchMeteorologyData,
      transform: selectGasSuggestions,
      params: {
        chainId: $ => $(useDepositStore, state => state.getAssetChainId()),
      },
      cacheTime: time.seconds(36),
      keepPreviousData: true,
      staleTime: time.seconds(12),
    },

    (_, get) => ({
      getGasSuggestions: () => get().getData() ?? undefined,
    })
  );

  const useGasLimitStore = createQueryStore<GasLimit, GasLimitParams>({
    fetcher: createGasLimitFetcher(useDepositStore, useQuoteStore),
    enabled: $ => $(useQuoteKey, isValidQuoteKey),
    params: {
      assetToSellUniqueId: $ => $(useDepositStore, selectAssetUniqueId),
      quoteKey: $ => $(useQuoteKey),
    },
    cacheTime: time.minutes(1),
    keepPreviousData: true,
    staleTime: time.seconds(30),
  });

  const useGasSettings = createDerivedStore(
    $ => {
      const meteorologyData = $(useMeteorologyStore, state => state.getData());
      const selectedGasSpeed = $(useDepositStore, state => state.getGasSpeed());
      if (!meteorologyData) return undefined;
      return selectGasSettings(meteorologyData, selectedGasSpeed);
    },
    { equalityFn: shallowEqual, fastMode: true }
  );

  const useGasFeeEstimator = createDerivedStore(
    $ => {
      const gasSettings = $(useGasSettings);
      const gasLimit = $(useGasLimitStore, state => state.getData());
      const currency = $(userAssetsStoreManager, state => state.currency);
      return buildGasFeeEstimator(gasSettings, gasLimit, currency);
    },
    { fastMode: true }
  );

  const useMaxSwappableAmount = createDerivedStore(
    $ => {
      const asset = $(useDepositStore, state => state.getAsset());
      const gasLimit = $(useGasLimitStore, state => state.getData());
      const gasSettings = $(useGasSettings);
      return computeMaxSwappableAmount(asset, gasSettings, gasLimit ?? undefined) || asset?.balance.amount;
    },
    { fastMode: true }
  );

  return {
    useGasFeeEstimator,
    useGasLimitStore,
    useGasSettings,
    useMaxSwappableAmount,
    useMeteorologyStore,
  };
}

// ============ Fetchers ======================================================= //

async function fetchMeteorologyData({ chainId }: MeteorologyParams, abortController: AbortController | null): Promise<MeteorologyData> {
  const parsedResponse = await rainbowMeteorologyGetData<MeteorologyData>(chainId, abortController);
  return parsedResponse.data;
}

function createGasLimitFetcher(
  useDepositStore: PerpsDepositStoreType,
  useQuoteStore: PerpsDepositQuoteStoreType
): (params: GasLimitParams) => Promise<GasLimit> {
  return async function fetchGasLimit(): Promise<GasLimit> {
    const asset = useDepositStore.getState().asset;
    const quote = useQuoteStore.getState().getData();
    const chainId = useDepositStore.getState().getAssetChainId();

    if (!asset || !isValidQuote(quote)) {
      return gasUnits.basic_swap[chainId];
    }

    if (!isCrosschainQuote(quote)) {
      return gasUnits.basic_swap[chainId];
    }

    return estimateUnlockAndCrosschainSwap({
      assetToSell: asset,
      chainId,
      quote,
      sellAmount: quote.sellAmount.toString(),
    });
  };
}

// ============ Selectors ====================================================== //

function isValidQuoteKey(key: number | null): boolean {
  return key !== null;
}

function selectAssetUniqueId(state: InferStoreState<PerpsDepositStoreType>): string | null {
  return state.asset?.uniqueId ?? null;
}

function selectGasSettings(meteorologyData: GasSuggestions | undefined, selectedGasSpeed: GasSpeed): GasSettings | undefined {
  if (!meteorologyData) return undefined;
  return meteorologyData[selectedGasSpeed];
}

function selectGasSuggestions(meteorologyData: MeteorologyData | null): GasSuggestions | null {
  if (!meteorologyData) return null;
  if ('legacy' in meteorologyData.data) {
    const { fastGasPrice, proposeGasPrice, safeGasPrice } = meteorologyData.data.legacy;
    return {
      [GasSpeed.URGENT]: { gasPrice: gweiToWei(fastGasPrice), isEIP1559: false },
      [GasSpeed.FAST]: { gasPrice: gweiToWei(proposeGasPrice), isEIP1559: false },
      [GasSpeed.NORMAL]: { gasPrice: gweiToWei(safeGasPrice), isEIP1559: false },
      [GasSpeed.CUSTOM]: undefined,
    };
  } else if ('data' in meteorologyData) {
    const { baseFeeSuggestion, maxPriorityFeeSuggestions } = meteorologyData.data;
    return {
      [GasSpeed.URGENT]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.urgent },
      [GasSpeed.FAST]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.fast },
      [GasSpeed.NORMAL]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.normal },
      [GasSpeed.CUSTOM]: undefined,
    };
  }
  return null;
}

// ============ Utilities ==================================================== //

type GasFeeEstimator = (nativeNetworkAsset: FormattedExternalAsset | null | undefined) => string | undefined;

function buildGasFeeEstimator(gasSettings: GasSettings | undefined, gasLimit: string | null, currency: NativeCurrencyKey): GasFeeEstimator {
  if (!gasLimit || !gasSettings) return getUndefinedFee;
  return nativeNetworkAsset => calculateGasFee(gasSettings, gasLimit, currency, nativeNetworkAsset);
}

function calculateGasFee(
  gasSettings: GasSettings,
  gasLimit: string,
  currency: NativeCurrencyKey,
  nativeNetworkAsset: FormattedExternalAsset | null | undefined
): string | undefined {
  if (!nativeNetworkAsset?.price) return;

  const gasFee = calculateGasFeeWorklet(gasSettings, gasLimit);
  if (isNaN(Number(gasFee))) return;

  const nativeAssetPrice = nativeNetworkAsset.price.value?.toString();
  if (!nativeAssetPrice) return `${formatNumber(weiToGwei(gasFee))} Gwei`;

  const formattedFee = formatUnits(safeBigInt(gasFee), nativeNetworkAsset.decimals).toString();
  const feeInNativeCurrency = multiply(nativeAssetPrice, formattedFee);

  return convertAmountToNativeDisplayWorklet(feeInNativeCurrency, currency, true);
}

function getUndefinedFee(): undefined {
  return undefined;
}
