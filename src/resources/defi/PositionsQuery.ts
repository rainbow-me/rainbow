import { NativeCurrencyKey } from '@/entities';
import { AddysPositionsResponse, RainbowPositions } from './types';
import { parsePositions } from './utils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAddysHttpClient } from '@/resources/addys/client';
import { RainbowError, logger } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { Address } from 'viem';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { time } from '@/utils';
import { noop } from 'lodash';

const STABLE_OBJECT: RainbowPositions = {
  totals: {
    totals: { amount: '0', display: '0' },
    totalLocked: '0',
    borrows: { amount: '0', display: '0' },
    claimables: { amount: '0', display: '0' },
    deposits: { amount: '0', display: '0' },
    stakes: { amount: '0', display: '0' },
    total: { amount: '0', display: '0' },
  },
  positionTokens: [],
  positions: [],
};

type PositionsStoreParams = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
};

const getPositions = async (
  address: string,
  currency: NativeCurrencyKey,
  abortController: AbortController | null
): Promise<RainbowPositions> => {
  if (!address) {
    abortController?.abort();
    return STABLE_OBJECT;
  }
  const networkString = useBackendNetworksStore.getState().getSupportedChainIds().join(',');
  const url = `/${networkString}/${address}/positions`;
  const response = await getAddysHttpClient().get<AddysPositionsResponse>(url, {
    params: {
      currency,
      enableThirdParty: 'true',
    },
  });

  if (response.data) {
    return parsePositions(response.data, currency);
  }

  // should pop a warn here
  return STABLE_OBJECT;
};

export const positionsStore = createQueryStore<RainbowPositions, PositionsStoreParams>(
  {
    fetcher: async ({ address, currency }, abortController) => {
      try {
        if (!address) {
          abortController?.abort();
          return STABLE_OBJECT;
        }
        return getPositions(address, currency, abortController);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return STABLE_OBJECT;
        logger.error(new RainbowError('[positionsStore]: Failed to fetch positions'), { e });
        return STABLE_OBJECT;
      }
    },
    params: {
      address: $ => $(userAssetsStoreManager).address,
      currency: $ => $(userAssetsStoreManager).currency,
    },
    keepPreviousData: true,
    enabled: $ => $(userAssetsStoreManager, state => !!state.address),
    staleTime: time.hours(1),
  },
  noop,
  {
    storageKey: 'positions',
    version: 1,
  }
);
