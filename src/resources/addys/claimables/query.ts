import { NativeCurrencyKey } from '@/entities';
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

const STABLE_CLAIMABLES: ReturnType<typeof parseClaimables<Claimable>> = [];

export async function getClaimables({ address, currency, abortController }: ClaimablesArgs) {
  try {
    if (!address) {
      abortController?.abort();
      logger.warn('[getClaimables]: No address provided, returning stable claimables array');
      return STABLE_CLAIMABLES;
    }

    const url = `/${useBackendNetworksStore.getState().getSupportedChainIds().join(',')}/${address}/claimables`;
    const { data } = await getAddysHttpClient().get<ConsolidatedClaimablesResponse>(url, {
      params: {
        currency: currency.toLowerCase(),
      },
      signal: abortController?.signal,
      timeout: 20000,
    });

    if (data.metadata.status !== 'ok') {
      logger.error(new RainbowError('[getClaimables]: Failed to fetch claimables (API error)'), {
        message: data.metadata.errors,
      });
      if (!data.payload.claimables.length) {
        return STABLE_CLAIMABLES;
      }
    }

    return parseClaimables(data.payload.claimables, currency);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return STABLE_CLAIMABLES;
    logger.error(new RainbowError('[getClaimables]: Failed to fetch claimables (client error)'), {
      message: (e as Error)?.message,
    });
    return STABLE_CLAIMABLES;
  }
}

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
            const { amount, display } = convertAmountAndPriceToNativeDisplay(
              claimableETH.amount,
              ethNativeAsset.price?.value || 0,
              currency
            );
            if (!isZero(amount)) {
              const ethRewardsClaimable = {
                value: {
                  claimAsset: claimableETH,
                  nativeAsset: {
                    amount,
                    display,
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
    staleTime: time.seconds(10),
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
