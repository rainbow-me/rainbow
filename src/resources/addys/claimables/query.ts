import { NativeCurrencyKey } from '@/entities';
import { Claimable, ConsolidatedClaimablesResponse } from './types';
import { logger, RainbowError } from '@/logger';
import { parseClaimables } from './utils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAddysHttpClient } from '../client';
import { Address } from 'viem';
import {
  convertRawAmountToBalance,
  greaterThan,
  convertAmountAndPriceToNativeDisplay,
  isZero,
  convertAmountToNativeDisplay,
  add,
} from '@/helpers/utilities';
import { metadataPOSTClient } from '@/graphql';
import { getNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { ChainId } from '@/state/backendNetworks/types';
import { time } from '@/utils';
import { throttle } from 'lodash';
import { analytics } from '@/analytics';
import { ClaimablesStore } from '@/state/claimables/claimables';

export type ClaimablesArgs = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
  abortController?: AbortController | null;
};

const STABLE_CLAIMABLES: ClaimablesStore = {
  claimables: [],
  totalValue: '0',
};

export async function getClaimables({ address, currency, abortController }: ClaimablesArgs) {
  try {
    if (!address) {
      abortController?.abort();
      logger.warn('[getClaimables]: No address provided, returning stable claimables array');
      return STABLE_CLAIMABLES;
    }

    const claimablesUrl = `/${useBackendNetworksStore.getState().getSupportedChainIds().join(',')}/${address}/claimables`;

    const [points, claimables] = await Promise.all([
      metadataPOSTClient.getPointsDataForWallet({ address }),
      getAddysHttpClient().get<ConsolidatedClaimablesResponse>(claimablesUrl, {
        params: {
          currency: currency.toLowerCase(),
        },
        signal: abortController?.signal,
        timeout: 20000,
      }),
    ]);

    if (claimables.data.metadata.status !== 'ok') {
      logger.error(new RainbowError('[getClaimables]: Failed to fetch claimables (API error)'), {
        message: claimables.data.metadata.errors,
      });
      if (!claimables.data.payload.claimables.length) {
        return STABLE_CLAIMABLES;
      }
    }

    const sortedClaimables = parseClaimables(claimables.data.payload.claimables, currency).sort((a, b) =>
      greaterThan(a.value.nativeAsset.amount || '0', b.value.nativeAsset.amount || '0') ? -1 : 1
    );

    if (points?.points?.user?.rewards?.claimable) {
      const ethNativeAsset = await getNativeAssetForNetwork({ chainId: ChainId.mainnet });
      if (ethNativeAsset) {
        const claimableETH = convertRawAmountToBalance(points?.points?.user?.rewards?.claimable || '0', {
          decimals: 18,
          symbol: 'ETH',
        });
        const { amount, display } = convertAmountAndPriceToNativeDisplay(claimableETH.amount, ethNativeAsset.price?.value || 0, currency);
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
          sortedClaimables.unshift(ethRewardsClaimable);
        }
      }
    }

    throttledClaimablesAnalytics(sortedClaimables);

    return {
      claimables: sortedClaimables,
      totalValue: convertAmountToNativeDisplay(
        sortedClaimables.reduce((acc, claimable) => add(acc, claimable.value.nativeAsset.amount || '0'), '0'),
        currency
      ),
    };
  } catch (e) {
    logger.error(new RainbowError('[getClaimables]: Failed to fetch claimables (client error)'), {
      message: (e as Error)?.message,
    });
    return STABLE_CLAIMABLES;
  }
}

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

    analytics.identify({ claimablesAmount: claimables.length, claimablesUSDValue: totalUSDValue, ...claimablesUSDValues });
  },
  time.hours(1),
  { trailing: false }
);
