import { useQuery } from '@tanstack/react-query';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { Address } from 'viem';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';

import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { SupportedCurrencyKey } from '@/references';
import { ParsedAssetsDictByChain, ZerionAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { AddressAssetsReceivedMessage } from '@/__swaps__/types/refraction';
import { parseUserAsset } from '@/__swaps__/utils/assets';
import { greaterThan } from '@/helpers/utilities';

import { fetchUserAssetsByChain } from './userAssetsByChain';
import { fetchAnvilBalancesByChainId } from '@/resources/assets/anvilAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { staleBalancesStore } from '@/state/staleBalances';
import { IS_TEST } from '@/env';
import store from '@/redux/store';

const addysHttp = new RainbowFetchClient({
  baseURL: 'https://addys.p.rainbow.me/v3',
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

const USER_ASSETS_REFETCH_INTERVAL = 60000;
const USER_ASSETS_TIMEOUT_DURATION = 20000;
const USER_ASSETS_STALE_INTERVAL = 30000;

// ///////////////////////////////////////////////
// Query Types

export type UserAssetsArgs = {
  address: Address | string;
  currency: SupportedCurrencyKey;
  testnetMode?: boolean;
};

type SetUserAssetsArgs = {
  address: Address | string;
  currency: SupportedCurrencyKey;
  userAssets?: UserAssetsResult;
  testnetMode?: boolean;
};

type SetUserDefaultsArgs = {
  address: Address | string;
  currency: SupportedCurrencyKey;
  staleTime: number;
  testnetMode?: boolean;
};

type FetchUserAssetsArgs = {
  address: Address | string;
  currency: SupportedCurrencyKey;
  testnetMode?: boolean;
};

// ///////////////////////////////////////////////
// Query Key

export const userAssetsQueryKey = ({ address, currency, testnetMode }: UserAssetsArgs) =>
  createQueryKey('userAssets', { address, currency, testnetMode }, { persisterVersion: 3 });

type UserAssetsQueryKey = ReturnType<typeof userAssetsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

export const userAssetsFetchQuery = ({ address, currency, testnetMode }: FetchUserAssetsArgs) => {
  return queryClient.fetchQuery(userAssetsQueryKey({ address, currency, testnetMode }), userAssetsQueryFunction);
};

export async function queryUserAssets({
  address = store.getState().settings.accountAddress,
  currency = store.getState().settings.nativeCurrency,
  testnetMode = false,
}: Partial<FetchUserAssetsArgs> = {}) {
  const queryKey = userAssetsQueryKey({ address, currency, testnetMode });

  const cachedData = queryClient.getQueryData<ParsedAssetsDictByChain>(queryKey);
  if (cachedData) return cachedData;

  return userAssetsFetchQuery({ address, currency, testnetMode });
}

export const userAssetsSetQueryDefaults = ({ address, currency, staleTime, testnetMode }: SetUserDefaultsArgs) => {
  queryClient.setQueryDefaults(userAssetsQueryKey({ address, currency, testnetMode }), {
    staleTime,
  });
};

export const userAssetsSetQueryData = ({ address, currency, userAssets, testnetMode }: SetUserAssetsArgs) => {
  queryClient.setQueryData(userAssetsQueryKey({ address, currency, testnetMode }), userAssets);
};

async function userAssetsQueryFunction({
  queryKey: [{ address, currency, testnetMode }],
}: QueryFunctionArgs<typeof userAssetsQueryKey>): Promise<ParsedAssetsDictByChain> {
  if (!address) {
    return {};
  }
  if (testnetMode) {
    const { assets, chainIdsInResponse } = await fetchAnvilBalancesByChainId(address);
    const parsedAssets: Array<{
      asset: ZerionAsset;
      quantity: string;
      small_balances: boolean;
    }> = Object.values(assets).map(asset => ({
      asset: asset.asset,
      quantity: asset.quantity,
      small_balances: false,
    }));

    const parsedAssetsDict = await parseUserAssets({
      assets: parsedAssets,
      chainIds: chainIdsInResponse,
      currency,
    });

    return parsedAssetsDict;
  }

  const cache = queryClient.getQueryCache();
  const cachedUserAssets = (cache.find(userAssetsQueryKey({ address, currency, testnetMode }))?.state?.data ||
    {}) as ParsedAssetsDictByChain;
  try {
    staleBalancesStore.getState().clearExpiredData(address);
    const staleBalanceParam = staleBalancesStore.getState().getStaleBalancesQueryParam(address);
    let url = `/${useBackendNetworksStore.getState().getSupportedChainIds().join(',')}/${address}/assets?currency=${currency.toLowerCase()}`;
    if (staleBalanceParam) {
      url += staleBalanceParam;
    }
    const res = await addysHttp.get<AddressAssetsReceivedMessage>(url, {
      timeout: USER_ASSETS_TIMEOUT_DURATION,
    });
    const chainIdsInResponse = res?.data?.meta?.chain_ids || [];
    const chainIdsWithErrorsInResponse = res?.data?.meta?.chain_ids_with_errors || [];
    const assets = res?.data?.payload?.assets?.filter(asset => !asset.asset.defi_position) || [];
    if (address) {
      if (chainIdsWithErrorsInResponse.length) {
        userAssetsQueryFunctionRetryByChain({
          address,
          chainIds: chainIdsWithErrorsInResponse,
          currency,
          testnetMode,
        });
      }
      if (assets.length && chainIdsInResponse.length) {
        const parsedAssetsDict = await parseUserAssets({
          assets,
          chainIds: chainIdsInResponse,
          currency,
        });

        for (const missingChainId of chainIdsWithErrorsInResponse) {
          if (cachedUserAssets[missingChainId]) {
            parsedAssetsDict[missingChainId] = cachedUserAssets[missingChainId];
          }
        }
        return parsedAssetsDict;
      }
    }
    return cachedUserAssets;
  } catch (e) {
    logger.error(new RainbowError('[userAssetsQueryFunction]: Failed to fetch user assets'), {
      message: (e as Error)?.message,
    });
    return cachedUserAssets;
  }
}

export type UserAssetsResult = QueryFunctionResult<typeof userAssetsQueryFunction>;

async function userAssetsQueryFunctionRetryByChain({
  address,
  chainIds,
  currency,
  testnetMode,
}: {
  address: Address | string;
  chainIds: ChainId[];
  currency: SupportedCurrencyKey;
  testnetMode?: boolean;
}) {
  try {
    const cache = queryClient.getQueryCache();
    const cachedUserAssets =
      (cache.find(userAssetsQueryKey({ address, currency, testnetMode }))?.state?.data as ParsedAssetsDictByChain) || {};
    const retries = [];
    for (const chainIdWithError of chainIds) {
      retries.push(
        fetchUserAssetsByChain(
          {
            address,
            chainId: chainIdWithError,
            currency,
          },
          { cacheTime: 0 }
        )
      );
    }
    const parsedRetries = await Promise.all(retries);
    for (const parsedAssets of parsedRetries) {
      if (parsedAssets) {
        const values = Object.values(parsedAssets);
        if (values[0]) {
          cachedUserAssets[values[0].chainId] = parsedAssets;
        }
      }
    }
    queryClient.setQueryData(userAssetsQueryKey({ address, currency, testnetMode }), cachedUserAssets);
  } catch (e) {
    logger.error(new RainbowError('[userAssetsQueryFunctionRetryByChain]: Failed to retry fetching user assets'), {
      message: (e as Error)?.message,
    });
  }
}

export async function parseUserAssets({
  assets,
  chainIds,
  currency,
}: {
  assets: {
    quantity: string;
    small_balance?: boolean;
    asset: ZerionAsset;
  }[];
  chainIds: ChainId[];
  currency: SupportedCurrencyKey;
}) {
  const parsedAssetsDict = chainIds.reduce((dict, currentChainId) => ({ ...dict, [currentChainId]: {} }), {}) as ParsedAssetsDictByChain;
  for (const { asset, quantity, small_balance } of assets) {
    if (greaterThan(quantity, 0)) {
      const parsedAsset = parseUserAsset({
        asset,
        currency,
        balance: quantity,
        smallBalance: small_balance,
      });
      parsedAssetsDict[parsedAsset?.chainId][parsedAsset.uniqueId] = parsedAsset;
    }
  }

  return parsedAssetsDict;
}

// ///////////////////////////////////////////////
// Query Hook

export function useUserAssets<TSelectResult = UserAssetsResult>(
  { address, currency }: UserAssetsArgs,
  config: QueryConfigWithSelect<UserAssetsResult, Error, TSelectResult, UserAssetsQueryKey> = {}
) {
  const { connectedToAnvil } = useConnectedToAnvilStore();
  return useQuery(userAssetsQueryKey({ address, currency, testnetMode: connectedToAnvil }), userAssetsQueryFunction, {
    ...config,
    enabled: !!address && !!currency,
    refetchInterval: USER_ASSETS_REFETCH_INTERVAL,
    staleTime: IS_TEST ? 0 : USER_ASSETS_STALE_INTERVAL,
  });
}
