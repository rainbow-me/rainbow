import { NativeCurrencyKey } from '@/entities';
import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { Claimable, ConsolidatedClaimablesResponse } from './types';
import { logger, RainbowError } from '@/logger';
import { parseClaimables } from './utils';
import { useRemoteConfig } from '@/model/remoteConfig';
import { CLAIMABLES, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAddysHttpClient } from '../client';
import { Address } from 'viem';

// ///////////////////////////////////////////////
// Query Types

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
    }

    return parseClaimables(data.payload.claimables, currency);
  } catch (e) {
    logger.error(new RainbowError('[claimablesQueryFunction]: Failed to fetch claimables (client error)'), {
      message: (e as Error)?.message,
    });
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

export function useClaimables<T extends ClaimablesResult>(
  { address, currency, abortController }: ClaimablesArgs,
  config: QueryConfigWithSelect<ClaimablesResult, Error, T, ClaimablesQueryKey> = {}
) {
  const { claimables: remoteFlag } = useRemoteConfig();
  const localFlag = useExperimentalFlag(CLAIMABLES);

  return useQuery(claimablesQueryKey({ address, currency, abortController }), claimablesQueryFunction, {
    ...config,
    enabled: !!address && (remoteFlag || localFlag) && !IS_TEST,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 60 * 24,
  });
}
