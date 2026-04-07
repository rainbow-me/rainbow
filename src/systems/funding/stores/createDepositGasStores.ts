import { formatUnits } from 'viem';
import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { type MeteorologyLegacyResponse, type MeteorologyResponse } from '@/entities/gas';
import { rainbowMeteorologyGetData } from '@/handlers/gasFees';
import { convertAmountToNativeDisplayWorklet, formatNumber, multiply } from '@/helpers/utilities';
import { logger } from '@/logger';
import { gweiToWei, weiToGwei } from '@/parsers/gas';
import { estimateUnlockAndCrosschainSwap } from '@/raps/actions/crosschainSwap';
import { estimateUnlockAndSwap } from '@/raps/actions/swap';
import { gasUnits } from '@/references/gasUnits';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { type InferStoreState } from '@/state/internal/types';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { type GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { GasSpeed } from '@/__swaps__/types/gas';
import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { isLegacyMeteorologyFeeData } from '@/resources/meteorology/classification';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';
import { createExternalTokenStore, type FormattedExternalAsset } from './createExternalTokenStore';
import { computeMaxSwappableAmount } from './createDepositStore';
import {
  type AmountStoreType,
  type DepositGasHookParams,
  type DepositGasLimitParams,
  type DepositGasSponsorshipParams,
  type DepositGasSuggestions,
  type DepositGasStoresType,
  type DepositMeteorologyActions,
  type DepositMeteorologyParams,
  type DepositQuoteStoreType,
  type DepositStoreType,
  type DepositConfig,
} from '../types';
import { isValidQuote } from '../utils/quotes';

// ============ Types ========================================================= //

type GasLimit = string;
type MeteorologyData = MeteorologyLegacyResponse | MeteorologyResponse;

// ============ Gas Stores Factory ============================================ //

export function createDepositGasStores(
  config: DepositConfig,
  useAmountStore: AmountStoreType,
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): DepositGasStoresType {
  const hasCustomGasLimitEstimator = Boolean(config.gas?.estimateGasLimit);

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

  const useNormalizedAmount = createDerivedStore($ => $(useAmountStore, state => normalizeAmount(state.amount)), { fastMode: true });

  const useCanEstimateGasLimit = createDerivedStore(
    $ => {
      const normalizedAmount = $(useNormalizedAmount);
      const hasAmount = hasNonZeroAmount(normalizedAmount);
      const hasAsset = $(useDepositStore, selectAssetUniqueId) !== null;

      if (!hasAsset || !hasAmount) return false;
      if (hasCustomGasLimitEstimator) return true;
      return isValidQuoteKey($(useQuoteKey));
    },
    { fastMode: true }
  );

  const useCanCheckGasSponsorship = createDerivedStore(
    $ => {
      const hasSponsorshipHook = Boolean(config.gas?.isSponsored);
      if (!hasSponsorshipHook) return false;

      const normalizedAmount = $(useNormalizedAmount);
      const hasAmount = hasNonZeroAmount(normalizedAmount);
      const hasAsset = $(useDepositStore, selectAssetUniqueId) !== null;
      const hasAccountAddress = $(useWalletsStore, state => Boolean(state.accountAddress));

      return hasAccountAddress && hasAsset && hasAmount;
    },
    { fastMode: true }
  );

  const useGasLimitStore = createQueryStore<GasLimit, DepositGasLimitParams>({
    fetcher: createGasLimitFetcher(config, useAmountStore, useDepositStore, useQuoteStore),
    enabled: $ => $(useCanEstimateGasLimit),
    params: {
      amount: $ => $(useNormalizedAmount),
      assetToSellUniqueId: $ => $(useDepositStore, selectAssetUniqueId),
      quoteKey: $ => $(useQuoteKey),
    },
    cacheTime: time.minutes(1),
    keepPreviousData: true,
    staleTime: time.seconds(30),
  });

  const useGasSponsorshipStore = createQueryStore<boolean, DepositGasSponsorshipParams>({
    fetcher: createGasSponsorshipFetcher(config, useAmountStore, useDepositStore, useQuoteStore),
    enabled: $ => $(useCanCheckGasSponsorship),
    params: {
      accountAddress: $ => $(useWalletsStore).accountAddress,
      amount: $ => $(useNormalizedAmount),
      assetToSellUniqueId: $ => $(useDepositStore, selectAssetUniqueId),
      quoteKey: $ => $(useQuoteKey),
    },
    cacheTime: time.seconds(20),
    keepPreviousData: true,
    staleTime: time.seconds(8),
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

  const useIsGasSponsored = createDerivedStore(
    $ => {
      return $(useGasSponsorshipStore, state => state.getData()) ?? false;
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
    useGasSponsorshipStore,
    useIsGasSponsored,
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
  config: DepositConfig,
  useAmountStore: AmountStoreType,
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): (params: DepositGasLimitParams) => Promise<GasLimit> {
  return async function fetchGasLimit(): Promise<GasLimit> {
    const asset = useDepositStore.getState().asset;
    const quote = useQuoteStore.getState().getData();
    const chainId = useDepositStore.getState().getAssetChainId();

    if (!asset) {
      return getDefaultGasLimit(chainId);
    }

    if (config.gas?.estimateGasLimit) {
      const params = getGasHookParams(config, useAmountStore, useDepositStore, useQuoteStore);
      if (!params) {
        return getDefaultGasLimit(chainId);
      }

      try {
        return await config.gas.estimateGasLimit(params);
      } catch (error) {
        logger.warn('[createDepositGasStores]: custom gas-limit estimation failed', {
          error,
          id: config.id,
        });
        return getDefaultGasLimit(chainId);
      }
    }

    if (!isValidQuote(quote)) {
      return getDefaultGasLimit(chainId);
    }

    if (isCrosschainQuote(quote)) {
      return estimateUnlockAndCrosschainSwap({
        chainId,
        quote,
      });
    }

    return estimateUnlockAndSwap({
      chainId,
      quote,
    });
  };
}

function createGasSponsorshipFetcher(
  config: DepositConfig,
  useAmountStore: AmountStoreType,
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): (params: DepositGasSponsorshipParams) => Promise<boolean> {
  return async function fetchIsGasSponsored(): Promise<boolean> {
    const sponsorshipHook = config.gas?.isSponsored;
    if (!sponsorshipHook) return false;

    const params = getGasHookParams(config, useAmountStore, useDepositStore, useQuoteStore);
    if (!params) return false;

    try {
      return Boolean(await sponsorshipHook(params));
    } catch (error) {
      logger.warn('[createDepositGasStores]: sponsorship check failed', {
        error,
        id: config.id,
      });
      return false;
    }
  };
}

function getGasHookParams(
  config: DepositConfig,
  useAmountStore: AmountStoreType,
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): DepositGasHookParams | null {
  const accountAddress = useWalletsStore.getState().accountAddress;
  const amount = normalizeAmount(useAmountStore.getState().amount);
  const asset = useDepositStore.getState().asset;

  if (!accountAddress || !asset || !hasNonZeroAmount(amount)) return null;

  return {
    accountAddress,
    amount,
    asset,
    recipient: config.to.recipient?.getState() ?? null,
    quote: useQuoteStore.getState().getData(),
  };
}

function getDefaultGasLimit(chainId: ChainId): string {
  return gasUnits.basic_swap[chainId] ?? gasUnits.basic_swap[ChainId.mainnet];
}

// ============ Selectors ===================================================== //

function isValidQuoteKey(key: number | null): boolean {
  return key !== null;
}

function normalizeAmount(amount: string): string {
  return stripNonDecimalNumbers(amount) || '0';
}

function hasNonZeroAmount(amount: string): boolean {
  return Number(amount) > 0;
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
  if (isLegacyMeteorologyFeeData(meteorologyData)) {
    const { fastGasPrice, proposeGasPrice, safeGasPrice } = meteorologyData.data.legacy;
    return {
      [GasSpeed.CUSTOM]: undefined,
      [GasSpeed.FAST]: { gasPrice: gweiToWei(proposeGasPrice), isEIP1559: false },
      [GasSpeed.NORMAL]: { gasPrice: gweiToWei(safeGasPrice), isEIP1559: false },
      [GasSpeed.URGENT]: { gasPrice: gweiToWei(fastGasPrice), isEIP1559: false },
    };
  }

  const { baseFeeSuggestion, maxPriorityFeeSuggestions } = meteorologyData.data;
  return {
    [GasSpeed.CUSTOM]: undefined,
    [GasSpeed.FAST]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.fast },
    [GasSpeed.NORMAL]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.normal },
    [GasSpeed.URGENT]: { isEIP1559: true, maxBaseFee: baseFeeSuggestion, maxPriorityFee: maxPriorityFeeSuggestions.urgent },
  };
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
