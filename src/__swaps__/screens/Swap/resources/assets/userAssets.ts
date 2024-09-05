import { useQuery } from '@tanstack/react-query';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { Address } from 'viem';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';

import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { SupportedCurrencyKey, SUPPORTED_CHAIN_IDS } from '@/references';
import { ParsedAssetsDictByChain, ZerionAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/chains/types';
import { AddressAssetsReceivedMessage } from '@/__swaps__/types/refraction';
import { parseUserAsset } from '@/__swaps__/utils/assets';
import { greaterThan } from '@/__swaps__/utils/numbers';

import { fetchUserAssetsByChain } from './userAssetsByChain';
import { fetchHardhatBalances, fetchHardhatBalancesByChainId } from '@/resources/assets/hardhatAssets';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';

const addysHttp = new RainbowFetchClient({
  baseURL: 'https://addys.p.rainbow.me/v3',
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

const USER_ASSETS_REFETCH_INTERVAL = 60000;
const USER_ASSETS_TIMEOUT_DURATION = 20000;
export const USER_ASSETS_STALE_INTERVAL = 30000;

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
  queryClient.fetchQuery(userAssetsQueryKey({ address, currency, testnetMode }), userAssetsQueryFunction);
};

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
    const { assets, chainIdsInResponse } = await fetchHardhatBalancesByChainId(address);
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
    const url = `/${SUPPORTED_CHAIN_IDS({ testnetMode }).join(',')}/${address}/assets`;
    const res = await addysHttp.get<AddressAssetsReceivedMessage>(url, {
      params: {
        currency: currency.toLowerCase(),
      },
      timeout: USER_ASSETS_TIMEOUT_DURATION,
    });
    const chainIdsInResponse = res?.data?.meta?.chain_ids || [];
    const chainIdsWithErrorsInResponse = res?.data?.meta?.chain_ids_with_errors || [];
    const assets = res?.data?.payload?.assets || [];
    if (address) {
      userAssetsQueryFunctionRetryByChain({
        address,
        chainIds: chainIdsWithErrorsInResponse,
        currency,
        testnetMode,
      });
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

type UserAssetsResult = QueryFunctionResult<typeof userAssetsQueryFunction>;

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
      const values = Object.values(parsedAssets);
      if (values[0]) {
        cachedUserAssets[values[0].chainId] = parsedAssets;
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
  const { connectedToHardhat } = useConnectedToHardhatStore();

  return useQuery(userAssetsQueryKey({ address, currency, testnetMode: connectedToHardhat }), userAssetsQueryFunction, {
    ...config,
    refetchInterval: USER_ASSETS_REFETCH_INTERVAL,
    staleTime: process.env.IS_TESTING === 'true' ? 0 : 1000,
  });
}
