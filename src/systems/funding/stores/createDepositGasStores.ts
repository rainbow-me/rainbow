import { createDerivedStore, createQueryStore, type InferStoreState } from '@storesjs/stores';
import { type Address } from 'viem';

import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { formatGasFee } from '@/features/gas/core/formatGasFee';
import { buildGasParams } from '@/features/gas/core/gasParams';
import { useMeteorologyStore } from '@/features/gas/data/meteorologyStore';
import { GasSpeed } from '@/features/gas/types/gasSpeed';
import { calculateMaxGasFeeWorklet } from '@/features/gas/utils/calculateGasFee';
import { gasUnits } from '@/features/gas/utils/gasUnits';
import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { logger } from '@/logger';
import { estimateUnlockAndCrosschainSwap } from '@/raps/actions/crosschainSwap';
import { estimateUnlockAndSwap } from '@/raps/actions/swap';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { shallowEqual } from '@/worklets/comparisons';

import {
  type AmountStoreType,
  type DepositConfig,
  type DepositGasConfig,
  type DepositGasHookParams,
  type DepositGasLimitParams,
  type DepositGasStoresType,
  type DepositQuoteStoreType,
  type DepositStoreType,
} from '../types';
import { isValidQuote } from '../utils/quotes';
import { computeMaxSwappableAmount } from './createDepositStore';
import { createExternalTokenStore } from './createExternalTokenStore';

// ============ Types ========================================================= //

type GasLimit = string;

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

  const useGasSuggestions = createDerivedStore($ => {
    const chainId = $(useDepositStore, s => s.getAssetChainId());
    return $(useMeteorologyStore, s => s.get(chainId)?.suggestions);
  });

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
      ? createQueryStore<boolean | null, GasSponsorshipQueryParams>({
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
      const suggestions = $(useGasSuggestions);
      const selectedGasSpeed = $(useDepositStore, s => s.getGasSpeed());
      return selectedGasSpeed === GasSpeed.CUSTOM ? undefined : suggestions?.[selectedGasSpeed];
    },
    { equalityFn: shallowEqual, lockDependencies: true }
  );

  const useEstimatedGasFee = createDerivedStore(
    $ => {
      const gasSettings = $(useGasSettings);
      const gasLimit = $(useGasLimitStore, s => s.getData());
      const currency = $(userAssetsStoreManager, s => s.currency);
      const nativeNetworkAsset = $(useNativeAssetStore, s => s.getData());

      if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;
      const fee = calculateMaxGasFeeWorklet(gasSettings, gasLimit);
      return formatGasFee(fee, nativeNetworkAsset.decimals, nativeNetworkAsset.price.value, currency);
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
    getGasParams: async () => {
      const deposit = useDepositStore.getState();
      const chainId = deposit.getAssetChainId();
      const speed = deposit.getGasSpeed();
      if (speed === GasSpeed.CUSTOM) return null;

      const market = useMeteorologyStore.getState();
      const data = market.get(chainId) ?? (await market.load(chainId));
      return data ? buildGasParams(data.suggestions[speed]) : null;
    },
    reset: () => {
      useGasLimitStore.getState().reset(true);
      useGasSponsorshipStore?.getState().reset(true);
    },
    useEstimatedGasFee,
    useGasLimitStore,
    useGasSettings,
    useGasSuggestions,
    useIsGasSponsored,
    useMaxSwappableAmount,
  };
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
): (params: GasSponsorshipQueryParams) => Promise<boolean | null> {
  return async function fetchIsGasSponsored(queryParams: GasSponsorshipQueryParams): Promise<boolean | null> {
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
      const resolved = await sponsorshipHook(params);
      // Preserve `null` (unknown) so it falls back to the prediction in
      // `useIsGasSponsored` rather than reading as "not sponsored".
      return resolved == null ? null : Boolean(resolved);
    } catch (error) {
      logger.warn('[createDepositGasStores]: sponsorship check failed', {
        error,
        id: config.id,
      });
      return null;
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
