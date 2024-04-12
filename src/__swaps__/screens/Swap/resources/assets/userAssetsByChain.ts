import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { SupportedCurrencyKey } from '@/references';
import { ParsedAssetsDictByChain, ParsedUserAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { AddressAssetsReceivedMessage } from '@/__swaps__/types/refraction';
import { RainbowError, logger } from '@/logger';

import { parseUserAssets, userAssetsQueryKey } from './userAssets';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { ADDYS_API_KEY } from 'react-native-dotenv';

const USER_ASSETS_REFETCH_INTERVAL = 60000;

const addysHttp = new RainbowFetchClient({
  baseURL: 'https://addys.p.rainbow.me/v3',
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

// ///////////////////////////////////////////////
// Query Types

export type UserAssetsByChainArgs = {
  address: Address;
  chainId: ChainId;
  currency: SupportedCurrencyKey;
};

// ///////////////////////////////////////////////
// Query Key

export const userAssetsByChainQueryKey = ({ address, chainId, currency }: UserAssetsByChainArgs) =>
  createQueryKey('userAssetsByChain', { address, chainId, currency }, { persisterVersion: 1 });

type UserAssetsByChainQueryKey = ReturnType<typeof userAssetsByChainQueryKey>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchUserAssetsByChain<TSelectData = UserAssetsByChainResult>(
  { address, chainId, currency }: UserAssetsByChainArgs,
  config: QueryConfigWithSelect<UserAssetsByChainResult, Error, TSelectData, UserAssetsByChainQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    userAssetsByChainQueryKey({
      address,
      chainId,
      currency,
    }),
    userAssetsByChainQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Function

export async function userAssetsByChainQueryFunction({
  queryKey: [{ address, chainId, currency }],
}: QueryFunctionArgs<typeof userAssetsByChainQueryKey>): Promise<Record<string, ParsedUserAsset>> {
  const cache = queryClient.getQueryCache();
  const cachedUserAssets = (cache.find(userAssetsQueryKey({ address, currency }))?.state?.data || {}) as ParsedAssetsDictByChain;
  const cachedDataForChain = cachedUserAssets?.[chainId];
  try {
    const url = `/${chainId}/${address}/assets/?currency=${currency.toLowerCase()}`;
    const res = await addysHttp.get<AddressAssetsReceivedMessage>(url);
    const chainIdsInResponse = res?.data?.meta?.chain_ids || [];
    const assets = res?.data?.payload?.assets || [];
    if (assets.length && chainIdsInResponse.length) {
      const parsedAssetsDict = await parseUserAssets({
        assets,
        chainIds: chainIdsInResponse,
        currency,
      });

      return parsedAssetsDict[chainId];
    } else {
      return cachedDataForChain;
    }
  } catch (e) {
    logger.error(new RainbowError(`userAssetsByChainQueryFunction - chainId = ${chainId}:`), {
      message: (e as Error)?.message,
    });
    return cachedDataForChain;
  }
}

type UserAssetsByChainResult = QueryFunctionResult<typeof userAssetsByChainQueryFunction>;

// ///////////////////////////////////////////////
// Query Hook

export function useUserAssetsByChain<TSelectResult = UserAssetsByChainResult>(
  { address, chainId, currency }: UserAssetsByChainArgs,
  config: QueryConfigWithSelect<UserAssetsByChainResult, Error, TSelectResult, UserAssetsByChainQueryKey> = {}
) {
  return useQuery(
    userAssetsByChainQueryKey({
      address,
      chainId,
      currency,
    }),
    userAssetsByChainQueryFunction,
    {
      ...config,
      refetchInterval: USER_ASSETS_REFETCH_INTERVAL,
    }
  );
}
