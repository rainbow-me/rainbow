import { formatUnits } from 'viem';
import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { MeteorologyLegacyResponse, MeteorologyResponse } from '@/entities/gas';
import { rainbowMeteorologyGetData } from '@/handlers/gasFees';
import { convertAmountToNativeDisplayWorklet, formatNumber, multiply } from '@/helpers/utilities';
import { gweiToWei, weiToGwei } from '@/parsers/gas';
import { estimateUnlockAndCrosschainSwap } from '@/raps/actions/crosschainSwap';
import { estimateUnlockAndSwap } from '@/raps/actions/swap';
import { gasUnits } from '@/references/gasUnits';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { InferStoreState } from '@/state/internal/types';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { GasSpeed } from '@/__swaps__/types/gas';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';
import { createExternalTokenStore, FormattedExternalAsset } from './createExternalTokenStore';
import { computeMaxSwappableAmount } from './createDepositStore';
import { isCrosschainQuote, isValidQuote } from '../utils/quotes';
import {
  DepositConfig,
  DepositGasLimitParams,
  DepositGasSuggestions,
  DepositGasStoresType,
  DepositMeteorologyActions,
  DepositMeteorologyParams,
  DepositQuoteStoreType,
  DepositStoreType,
} from '../types';

// ============ Types ========================================================= //

type GasLimit = string;
type MeteorologyData = MeteorologyLegacyResponse | MeteorologyResponse;

// ============ Gas Stores Factory ============================================ //

export function createDepositGasStores(
  _config: DepositConfig,
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): DepositGasStoresType {
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

  const useMeteorologyStore = createQueryStore<
    MeteorologyData,
    DepositMeteorologyParams,
    DepositMeteorologyActions,
    DepositGasSuggestions | null
  >(
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

  const useGasLimitStore = createQueryStore<GasLimit, DepositGasLimitParams>({
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

  const useNativeAssetStore = createExternalTokenStore(useDepositStore);

  const useGasSettings = createDerivedStore(
    $ => {
      const meteorologyData = $(useMeteorologyStore, state => state.getData());
      const selectedGasSpeed = $(useDepositStore, state => state.getGasSpeed());
      if (!meteorologyData) return undefined;
      return selectGasSettings(meteorologyData, selectedGasSpeed);
    },
    { equalityFn: shallowEqual, fastMode: true }
  );

  const useEstimatedGasFee = createDerivedStore(
    $ => {
      const gasSettings = $(useGasSettings);
      const gasLimit = $(useGasLimitStore, state => state.getData());
      const currency = $(userAssetsStoreManager, state => state.currency);
      const nativeNetworkAsset = $(useNativeAssetStore, state => state.getData());

      if (!gasLimit || !gasSettings) return;
      return calculateGasFee(gasSettings, gasLimit, currency, nativeNetworkAsset);
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
    useEstimatedGasFee,
    useGasLimitStore,
    useGasSettings,
    useMaxSwappableAmount,
    useMeteorologyStore,
  };
}

// ============ Meteorology Fetching ========================================== //

async function fetchMeteorologyData(
  { chainId }: DepositMeteorologyParams,
  abortController: AbortController | null
): Promise<MeteorologyData> {
  const parsedResponse = await rainbowMeteorologyGetData<MeteorologyData>(chainId, abortController);
  return parsedResponse.data;
}

// ============ Gas Limit Fetching ============================================ //

function createGasLimitFetcher(
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): (params: DepositGasLimitParams) => Promise<GasLimit> {
  return async function fetchGasLimit(): Promise<GasLimit> {
    const asset = useDepositStore.getState().asset;
    const quote = useQuoteStore.getState().getData();
    const chainId = useDepositStore.getState().getAssetChainId();

    if (!asset || !isValidQuote(quote)) {
      return gasUnits.basic_swap[chainId];
    }

    if (isCrosschainQuote(quote)) {
      return estimateUnlockAndCrosschainSwap({
        assetToSell: asset,
        chainId,
        quote,
        sellAmount: quote.sellAmount.toString(),
      });
    }

    return estimateUnlockAndSwap({
      assetToSell: asset,
      chainId,
      quote,
      sellAmount: quote.sellAmount.toString(),
    });
  };
}

// ============ Selectors ===================================================== //

function isValidQuoteKey(key: number | null): boolean {
  return key !== null;
}

function selectAssetUniqueId(state: InferStoreState<DepositStoreType>): string | null {
  return state.asset?.uniqueId ?? null;
}

function selectGasSettings(meteorologyData: DepositGasSuggestions | undefined, selectedGasSpeed: GasSpeed): GasSettings | undefined {
  if (!meteorologyData) return undefined;
  return meteorologyData[selectedGasSpeed];
}

function selectGasSuggestions(meteorologyData: MeteorologyData | null): DepositGasSuggestions | null {
  if (!meteorologyData) return null;
  if ('legacy' in meteorologyData.data) {
    const { fastGasPrice, proposeGasPrice, safeGasPrice } = meteorologyData.data.legacy;
    return {
      [GasSpeed.CUSTOM]: undefined,
      [GasSpeed.FAST]: { gasPrice: gweiToWei(proposeGasPrice), isEIP1559: false },
      [GasSpeed.NORMAL]: { gasPrice: gweiToWei(safeGasPrice), isEIP1559: false },
      [GasSpeed.URGENT]: { gasPrice: gweiToWei(fastGasPrice), isEIP1559: false },
    };
  } else if ('data' in meteorologyData) {
    const { baseFeeSuggestion, maxPriorityFeeSuggestions } = meteorologyData.data;
    return {
      [GasSpeed.CUSTOM]: undefined,
      [GasSpeed.FAST]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.fast },
      [GasSpeed.NORMAL]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.normal },
      [GasSpeed.URGENT]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.urgent },
    };
  }
  return null;
}

// ============ Gas Fee Calculation =========================================== //

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
