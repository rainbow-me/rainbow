import { NativeCurrencyKey } from '@/entities';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { ConsolidatedClaimablesResponse } from './types';
import { logger, RainbowError } from '@/logger';
import { parseClaimables } from './utils';
import { useRemoteConfig } from '@/model/remoteConfig';
import { CLAIMABLES, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const ADDYS_BASE_URL = 'https://addys.p.rainbow.me/v3';

export const addysHttp = new RainbowFetchClient({
  baseURL: ADDYS_BASE_URL,
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

// ///////////////////////////////////////////////
// Query Types

export type ClaimablesArgs = {
  address: string;
  currency: NativeCurrencyKey;
};

// ///////////////////////////////////////////////
// Query Key

export const claimablesQueryKey = ({ address, currency }: ClaimablesArgs) =>
  createQueryKey('claimables', { address, currency }, { persisterVersion: 4 });

type ClaimablesQueryKey = ReturnType<typeof claimablesQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function claimablesQueryFunction({ queryKey: [{ address, currency }] }: QueryFunctionArgs<typeof claimablesQueryKey>) {
  try {
    const url = `/${useBackendNetworksStore.getState().getSupportedChainIds().join(',')}/${address}/claimables`;
    const { data } = await addysHttp.get<ConsolidatedClaimablesResponse>(url, {
      params: {
        currency: currency.toLowerCase(),
      },
      timeout: 20000,
    });

    if (data.metadata.status !== 'ok') {
      logger.error(new RainbowError('[userAssetsQueryFunction]: Failed to fetch user assets (API error)'), {
        message: data.metadata.errors,
      });
    }

    return parseClaimables(data.payload.claimables, currency);
  } catch (e) {
    logger.error(new RainbowError('[userAssetsQueryFunction]: Failed to fetch user assets (client error)'), {
      message: (e as Error)?.message,
    });
  }
}

type ClaimablesResult = QueryFunctionResult<typeof claimablesQueryFunction>;

// ///////////////////////////////////////////////
// Query Hook

export function useClaimables(
  { address, currency }: ClaimablesArgs,
  config: QueryConfigWithSelect<ClaimablesResult, Error, ClaimablesResult, ClaimablesQueryKey> = {}
) {
  const { claimables: remoteFlag } = useRemoteConfig();
  const localFlag = useExperimentalFlag(CLAIMABLES);

  return useQuery(claimablesQueryKey({ address, currency }), claimablesQueryFunction, {
    ...config,
    enabled: !!address && (remoteFlag || localFlag) && !IS_TEST,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 60 * 24,
  });
}
