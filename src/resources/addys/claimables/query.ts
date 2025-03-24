import { NativeCurrencyKey } from '@/entities';
import { createQueryKey } from '@/react-query';
import { QueryFunctionContext } from '@tanstack/react-query';
import { Claimable, ConsolidatedClaimablesResponse } from './types';
import { logger, RainbowError } from '@/logger';
import { parseClaimables } from './utils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAddysHttpClient } from '../client';
import { Address } from 'viem';
import { createQueryStore } from '@/state/internal/createQueryStore';
import {
  convertRawAmountToBalance,
  greaterThan,
  convertAmountAndPriceToNativeDisplay,
  add,
  convertAmountToNativeDisplay,
  isZero,
} from '@/helpers/utilities';
import { metadataPOSTClient } from '@/graphql';
import { getNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { ChainId } from '@/state/backendNetworks/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { time } from '@/utils';
import { noop, throttle } from 'lodash';
import { analyticsV2 } from '@/analytics';

export type ClaimablesArgs = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
  abortController?: AbortController | null;
};

// ///////////////////////////////////////////////
// Query Key

export const claimablesQueryKey = ({ address, currency, abortController }: ClaimablesArgs) =>
  createQueryKey('claimables', { address, currency, abortController }, { persisterVersion: 4 });

type ClaimablesQueryKey = ReturnType<typeof claimablesQueryKey>;

const STABLE_CLAIMABLES: ReturnType<typeof parseClaimables<Claimable>> = [];

export async function getClaimables({ address, currency, abortController }: ClaimablesArgs) {
  try {
    const url = `/${useBackendNetworksStore.getState().getSupportedChainIds().join(',')}/${address}/claimables`;
    const { data } = await getAddysHttpClient().get<ConsolidatedClaimablesResponse>(url, {
      params: {
        currency: currency.toLowerCase(),
      },
      signal: abortController?.signal,
      timeout: 20000,
    });

    if (data.metadata.status !== 'ok') {
      logger.error(new RainbowError('[claimablesQueryFunction]: Failed to fetch claimables (API error)'), {
        message: data.metadata.errors,
      });
      if (!data.payload.claimables.length) {
        return STABLE_CLAIMABLES;
      }
    }

    return parseClaimables(data.payload.claimables, currency);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return STABLE_CLAIMABLES;
    logger.error(new RainbowError('[claimablesQueryFunction]: Failed to fetch claimables (client error)'), {
      message: (e as Error)?.message,
    });
    return STABLE_CLAIMABLES;
  }
}

// ///////////////////////////////////////////////
// Query Function

export async function claimablesQueryFunction({ queryKey }: QueryFunctionContext<ClaimablesQueryKey>) {
  const [{ address, currency, abortController }] = queryKey;
  return getClaimables({ address, currency, abortController });
}

export type ClaimablesResult = Awaited<ReturnType<typeof claimablesQueryFunction>>;

// ///////////////////////////////////////////////
// Query Hook

export type ClaimablesStore = {
  claimables: Claimable[];
  totalValue: string;
};

const STABLE_OBJECT: ClaimablesStore = {
  claimables: [],
  totalValue: '0',
};

export const claimablesStore = createQueryStore<ClaimablesStore, ClaimablesArgs>(
  {
    fetcher: async ({ address, currency }, abortController) => {
      try {
        if (!address) {
          abortController?.abort();
          return STABLE_OBJECT;
        }

        // Since we expose ETH Rewards as a claimable, we also need to fetch the points data from metadata client
        const points = await metadataPOSTClient.getPointsDataForWallet({ address });
        const claimables = (await getClaimables({ address, currency, abortController })).sort((a, b) =>
          greaterThan(a.value.nativeAsset.amount || '0', b.value.nativeAsset.amount || '0') ? -1 : 1
        );

        if (points?.points?.user?.rewards?.claimable) {
          const ethNativeAsset = await getNativeAssetForNetwork({ chainId: ChainId.mainnet });
          if (ethNativeAsset) {
            const claimableETH = convertRawAmountToBalance(points?.points?.user?.rewards?.claimable || '0', {
              decimals: 18,
              symbol: 'ETH',
            });
            const { amount } = convertAmountAndPriceToNativeDisplay(claimableETH.amount, ethNativeAsset.price?.value || 0, currency);
            if (!isZero(amount)) {
              const ethRewardsClaimable = {
                value: {
                  nativeAsset: {
                    amount,
                  },
                },
                uniqueId: 'rainbow-eth-rewards',
              } as Claimable;
              claimables.unshift(ethRewardsClaimable);
            }
          }
        }

        throttledClaimablesAnalytics(claimables);

        return {
          claimables,
          totalValue: convertAmountToNativeDisplay(
            claimables.reduce((acc, claimable) => add(acc, claimable.value.nativeAsset.amount || '0'), '0'),
            currency
          ),
          ethRewardsAmount: points?.points?.user?.rewards?.claimable || '0',
        };
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return STABLE_OBJECT;
        logger.error(new RainbowError('[claimablesStore]: Failed to fetch claimables'), { e });
        return STABLE_OBJECT;
      }
    },
    params: {
      address: $ => $(userAssetsStoreManager).address,
      currency: $ => $(userAssetsStoreManager).currency,
    },
    keepPreviousData: true,
    enabled: $ => $(userAssetsStoreManager, state => !!state.address),
    staleTime: time.minutes(10),
  },
  noop,
  {
    storageKey: 'claimables',
    version: 1,
  }
);

// user properties analytics for claimables that executes at max once every hour
const throttledClaimablesAnalytics = throttle(
  (claimables: Claimable[]) => {
    let totalUSDValue = 0;
    const claimablesUSDValues: {
      [key: string]: number;
    } = {};

    claimables.forEach(claimable => {
      const attribute = `claimable-${claimable.analyticsId}-USDValue`;
      totalUSDValue += claimable.value.usd;

      if (claimablesUSDValues[attribute] !== undefined) {
        claimablesUSDValues[attribute] += claimable.value.usd;
      } else {
        claimablesUSDValues[attribute] = claimable.value.usd;
      }
    });

    analyticsV2.identify({ claimablesAmount: claimables.length, claimablesUSDValue: totalUSDValue, ...claimablesUSDValues });
  },
  time.hours(1),
  { trailing: false }
);
