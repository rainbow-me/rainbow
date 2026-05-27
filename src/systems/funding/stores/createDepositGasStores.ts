import { createDerivedStore } from '@storesjs/stores';
import { formatUnits, type Address } from 'viem';

import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { safeBigInt } from '@/features/gas/hooks/useEstimatedGasFee';
import { type GasSettings, type MeteorologyLegacyResponse, type MeteorologyResponse } from '@/features/gas/types/gas';
import { GasSpeed } from '@/features/gas/types/gasSpeed';
import { rainbowMeteorologyGetData } from '@/features/gas/utils/gasFees';
import { gasUnits } from '@/features/gas/utils/gasUnits';
import { isLegacyMeteorologyFeeData } from '@/features/gas/utils/meteorologyClassification';
import { buildGasParams, gweiToWei, weiToGwei } from '@/features/gas/utils/parseGas';
import { convertAmountToNativeDisplayWorklet, formatNumber, multiply } from '@/helpers/utilities';
import { logger } from '@/logger';
import { estimateUnlockAndCrosschainSwap } from '@/raps/actions/crosschainSwap';
import { estimateUnlockAndSwap } from '@/raps/actions/swap';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { type InferStoreState } from '@/state/internal/types';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';

import {
  type AmountStoreType,
  type DepositConfig,
  type DepositGasConfig,
  type DepositGasHookParams,
  type DepositGasLimitParams,
  type DepositGasStoresType,
  type DepositGasSuggestions,
  type DepositMeteorologyActions,
  type DepositMeteorologyParams,
  type DepositQuoteStoreType,
  type DepositStoreType,
} from '../types';
import { isValidQuote } from '../utils/quotes';
import { computeMaxSwappableAmount } from './createDepositStore';
import { createExternalTokenStore, type FormattedExternalAsset } from './createExternalTokenStore';

// ============ Types ========================================================= //

type GasLimit = string;
type MeteorologyData = MeteorologyLegacyResponse | MeteorologyResponse;

type GasSponsorshipQueryParams = {
  accountAddress: Address | null;
  amount: string;
  assetToSellUniqueId: string | null;
  quoteKey: number | null;
};

// ============ Gas Stores Factory ============================================ //

const useAlwaysFalse = createDerivedStore(() => false, { lockDependencies: true });

export function createDepositGasStores(
  config: DepositConfig,
  useAmountStore: AmountStoreType,
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): DepositGasStoresType {
  const hasCustomGasLimit = Boolean(config.gas?.estimateGasLimit);
  const hasGasSponsorshipResolver = Boolean(config.gas?.isSponsored);
  const hasGasSponsorship = hasGasSponsorshipResolver || Boolean(config.gas?.predictIsSponsored);
  const needsGasHookParams = hasCustomGasLimit || hasGasSponsorshipResolver;

  /**
   * Produces a numeric key each time the `quote` object identity
   * changes to avoid serializing large quote objects as query keys.
   */
  const useQuoteKey = createDerivedStore(
    $ => {
      const quote = $(useQuoteStore, s => s.getData());
      if (!isValidQuote(quote)) return null;
      return performance.now();
    },
    { lockDependencies: true }
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
        chainId: $ => $(useDepositStore, s => s.getAssetChainId()),
      },
      cacheTime: time.seconds(36),
      keepPreviousData: true,
      staleTime: time.seconds(12),
    },

    (_, get) => ({
      getGasParams: async () => {
        const gasSuggestions = get().getData() ?? (await get().fetch(undefined, { throwOnError: true }));
        const gasSettings = selectGasSettings(gasSuggestions ?? undefined, useDepositStore.getState().getGasSpeed());
        return gasSettings ? buildGasParams(gasSettings) : null;
      },
      getGasSuggestions: () => get().getData() ?? undefined,
    })
  );

  const useHasGasHookParams = needsGasHookParams
    ? createDerivedStore(
        $ => {
          const assetUniqueId = $(useDepositStore, selectAssetUniqueId);
          const hasAmount = $(useAmountStore, s => hasNonZeroAmount(selectNormalizedAmount(s)));
          return Boolean(assetUniqueId && hasAmount);
        },
        { lockDependencies: true }
      )
    : null;

  const useGasLimitStore = createQueryStore<GasLimit, DepositGasLimitParams>({
    fetcher: createGasLimitFetcher(config, useDepositStore, useQuoteStore),
    enabled: hasCustomGasLimit && useHasGasHookParams ? $ => $(useHasGasHookParams) : $ => $(useQuoteKey, isValidQuoteKey),
    params: {
      accountAddress: hasCustomGasLimit ? $ => $(useWalletsStore, s => s.accountAddress) : null,
      amount: hasCustomGasLimit ? $ => $(useAmountStore, selectNormalizedAmount) : null,
      assetToSellUniqueId: $ => $(useDepositStore, selectAssetUniqueId),
      quoteKey: $ => $(useQuoteKey),
    },
    cacheTime: time.minutes(1),
    keepPreviousData: true,
    paramChangeThrottle: time.ms(100),
    staleTime: time.seconds(30),
  });

  const useCanCheckGasSponsorship =
    hasGasSponsorshipResolver && useHasGasHookParams
      ? createDerivedStore(
          $ => {
            const hasHookParams = $(useHasGasHookParams);
            const params = buildGasHookParams({
              accountAddress: $(useWalletsStore, s => s.accountAddress),
              amount: $(useAmountStore, selectNormalizedAmount),
              asset: $(useDepositStore, s => s.asset),
              config,
              quote: $(useQuoteStore, s => s.getData()),
            });
            const quoteKey = $(useQuoteKey);
            if (!hasHookParams) return false;
            if (!params) return false;

            const predictedSponsorship = resolveGasSponsorshipPrediction(config.gas?.predictIsSponsored, params, config);
            if (predictedSponsorship === false) return false;

            return hasHookParams && isValidQuoteKey(quoteKey);
          },
          { lockDependencies: true }
        )
      : useAlwaysFalse;

  const useGasSponsorshipStore =
    hasGasSponsorshipResolver && useHasGasHookParams
      ? createQueryStore<boolean, GasSponsorshipQueryParams>({
          fetcher: createGasSponsorshipFetcher(config, useDepositStore, useQuoteStore),
          enabled: $ => $(useCanCheckGasSponsorship),
          params: {
            accountAddress: $ => $(useWalletsStore, s => s.accountAddress),
            amount: $ => $(useAmountStore, selectNormalizedAmount),
            assetToSellUniqueId: $ => $(useDepositStore, selectAssetUniqueId),
            quoteKey: $ => $(useQuoteKey),
          },
          cacheTime: time.seconds(20),
          keepPreviousData: true,
          staleTime: time.seconds(20),
        })
      : null;

  const useNativeAssetStore = createExternalTokenStore(useDepositStore);

  const useGasSettings = createDerivedStore(
    $ => {
      const meteorologyData = $(useMeteorologyStore, s => s.getData());
      const selectedGasSpeed = $(useDepositStore, s => s.getGasSpeed());
      if (!meteorologyData) return undefined;
      return selectGasSettings(meteorologyData, selectedGasSpeed);
    },
    { equalityFn: shallowEqual, lockDependencies: true }
  );

  const useEstimatedGasFee = createDerivedStore(
    $ => {
      const gasSettings = $(useGasSettings);
      const gasLimit = $(useGasLimitStore, s => s.getData());
      const currency = $(userAssetsStoreManager, s => s.currency);
      const nativeNetworkAsset = $(useNativeAssetStore, s => s.getData());

      if (!gasLimit || !gasSettings) return;
      return calculateGasFee(gasSettings, gasLimit, currency, nativeNetworkAsset);
    },
    { lockDependencies: true }
  );

  const useIsGasSponsored = hasGasSponsorship
    ? createDerivedStore(
        $ => {
          const params = buildGasHookParams({
            accountAddress: $(useWalletsStore, s => s.accountAddress),
            amount: $(useAmountStore, selectNormalizedAmount),
            asset: $(useDepositStore, s => s.asset),
            config,
            quote: $(useQuoteStore, s => s.getData()),
          });

          const resolvedSponsorship = useGasSponsorshipStore ? $(useGasSponsorshipStore, s => s.getData()) : null;
          const predictedSponsorship = resolveGasSponsorshipPrediction(config.gas?.predictIsSponsored, params, config);

          if (!params) return false;
          if (predictedSponsorship === false) return false;
          if (resolvedSponsorship !== null) return resolvedSponsorship;

          return predictedSponsorship ?? false;
        },
        { lockDependencies: true }
      )
    : useAlwaysFalse;

  const useMaxSwappableAmount = createDerivedStore(
    $ => {
      const asset = $(useDepositStore, s => s.getAsset());
      const gasLimit = $(useGasLimitStore, s => s.getData());
      const gasSettings = $(useGasSettings);

      return computeMaxSwappableAmount(asset, gasSettings, gasLimit ?? undefined) || asset?.balance.amount;
    },
    { lockDependencies: true }
  );

  return {
    reset: () => {
      useMeteorologyStore.getState().reset(true);
      useGasLimitStore.getState().reset(true);
      useGasSponsorshipStore?.getState().reset(true);
    },
    useEstimatedGasFee,
    useGasLimitStore,
    useGasSettings,
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
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): (params: DepositGasLimitParams) => Promise<GasLimit> {
  return async function fetchGasLimit(queryParams: DepositGasLimitParams): Promise<GasLimit> {
    const asset = useDepositStore.getState().asset;
    const quote = useQuoteStore.getState().getData();
    const chainId = useDepositStore.getState().getAssetChainId();

    if (!asset) return getDefaultGasLimit(chainId);

    if (config.gas?.estimateGasLimit) {
      const params = buildGasHookParams({
        accountAddress: queryParams.accountAddress ?? null,
        amount: queryParams.amount ?? '0',
        asset,
        config,
        quote,
      });

      if (!params) return getDefaultGasLimit(chainId);

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

    if (!isValidQuote(quote)) return getDefaultGasLimit(chainId);

    return isCrosschainQuote(quote)
      ? estimateUnlockAndCrosschainSwap({
          chainId,
          quote,
        })
      : estimateUnlockAndSwap({ chainId, quote });
  };
}

// ============ Gas Sponsorship =============================================== //

function createGasSponsorshipFetcher(
  config: DepositConfig,
  useDepositStore: DepositStoreType,
  useQuoteStore: DepositQuoteStoreType
): (params: GasSponsorshipQueryParams) => Promise<boolean> {
  return async function fetchIsGasSponsored(queryParams: GasSponsorshipQueryParams): Promise<boolean> {
    const sponsorshipHook = config.gas?.isSponsored;
    if (!sponsorshipHook) return false;

    const params = buildGasHookParams({
      accountAddress: queryParams.accountAddress,
      amount: queryParams.amount,
      asset: useDepositStore.getState().asset,
      config,
      quote: useQuoteStore.getState().getData(),
    });

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

function resolveGasSponsorshipPrediction(
  predictSponsorship: DepositGasConfig['predictIsSponsored'] | undefined,
  params: DepositGasHookParams | null,
  config: DepositConfig
): boolean | null {
  if (!predictSponsorship || !params) return null;

  try {
    return Boolean(predictSponsorship(params));
  } catch (error) {
    logger.warn('[createDepositGasStores]: sponsorship prediction failed', {
      error,
      id: config.id,
    });
    return false;
  }
}

function buildGasHookParams({
  accountAddress,
  amount,
  asset,
  config,
  quote,
}: {
  accountAddress: Address | null;
  amount: string;
  asset: DepositGasHookParams['asset'] | null;
  config: DepositConfig;
  quote: DepositGasHookParams['quote'];
}): DepositGasHookParams | null {
  if (!accountAddress || !asset || !hasNonZeroAmount(amount)) return null;

  return {
    accountAddress,
    amount,
    asset,
    recipient: config.to.recipient?.getState() ?? null,
    quote,
  };
}

function getDefaultGasLimit(chainId: ChainId): string {
  return gasUnits.basic_swap[chainId] ?? gasUnits.basic_swap[ChainId.mainnet];
}

// ============ Selectors ===================================================== //

function isValidQuoteKey(key: number | null): boolean {
  return key !== null;
}

function hasNonZeroAmount(amount: string): boolean {
  return Number(amount) > 0;
}

function selectNormalizedAmount(state: InferStoreState<AmountStoreType>): string {
  return stripNonDecimalNumbers(state.amount) || '0';
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
