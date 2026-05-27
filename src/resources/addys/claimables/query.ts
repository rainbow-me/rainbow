import { throttle } from 'lodash';
import { type Address } from 'viem';

import { analytics } from '@/analytics';
import type { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { time } from '@/framework/core/utils/time';
import { add, convertAmountToNativeDisplay, greaterThan } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ClaimablesStore } from '@/state/claimables/claimables';

import { getAddysHttpClient } from '../client';
import { type Claimable, type ConsolidatedClaimablesResponse } from './types';
import { parseClaimables } from './utils';

export type ClaimablesArgs = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
  abortController?: AbortController | null;
};

const STABLE_CLAIMABLES: ClaimablesStore = {
  claimables: [],
  totalValue: '0',
  totalValueAmount: '0',
};

export async function getClaimables({ address, currency, abortController }: ClaimablesArgs) {
  try {
    if (!address) {
      abortController?.abort();
      logger.warn('[getClaimables]: No address provided, returning stable claimables array');
      return STABLE_CLAIMABLES;
    }

    const claimablesUrl = `/${useBackendNetworksStore.getState().getSupportedChainIds().join(',')}/${address}/claimables`;

    const claimables = await getAddysHttpClient().get<ConsolidatedClaimablesResponse>(claimablesUrl, {
      params: {
        currency: currency.toLowerCase(),
      },
      signal: abortController?.signal,
      timeout: 20000,
    });

    if (claimables.data.metadata.status !== 'ok') {
      logger.error(new RainbowError('[getClaimables]: Failed to fetch claimables (API error)'), {
        message: claimables.data.metadata.errors,
      });
      if (!claimables.data.payload.claimables.length) {
        return STABLE_CLAIMABLES;
      }
    }

    const sortedClaimables = parseClaimables(claimables.data.payload.claimables, currency).sort((a, b) =>
      greaterThan(a.totalCurrencyValue.amount || '0', b.totalCurrencyValue.amount || '0') ? -1 : 1
    );

    throttledClaimablesAnalytics(sortedClaimables);

    const totalValueAmount = sortedClaimables.reduce((acc, claimable) => add(acc, claimable.totalCurrencyValue.amount || '0'), '0');

    return {
      claimables: sortedClaimables,
      totalValue: convertAmountToNativeDisplay(totalValueAmount, currency),
      totalValueAmount,
    };
  } catch (e) {
    logger.error(new RainbowError('[getClaimables]: Failed to fetch claimables (client error)', e), {
      message: (e as Error)?.message,
    });
    return STABLE_CLAIMABLES;
  }
}

// user properties analytics for claimables that executes at max once every hour
const throttledClaimablesAnalytics = throttle(
  (claimables: Claimable[]) => {
    let totalUSDValue = '0';
    const claimablesUSDValues: {
      [key: string]: string;
    } = {};

    claimables.forEach(claimable => {
      const attribute = `claimable-${claimable.type}-USDValue`;
      totalUSDValue = add(totalUSDValue, claimable.totalCurrencyValue.amount);

      if (claimablesUSDValues[attribute] !== undefined) {
        claimablesUSDValues[attribute] = add(claimablesUSDValues[attribute], claimable.totalCurrencyValue.amount);
      } else {
        claimablesUSDValues[attribute] = claimable.totalCurrencyValue.amount;
      }
    });

    analytics.identify({ claimablesAmount: claimables.length, claimablesUSDValue: totalUSDValue, ...claimablesUSDValues });
  },
  time.hours(1),
  { trailing: false }
);
