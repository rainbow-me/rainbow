import { Address } from 'viem';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { SupportedCurrencyKey } from '@/references';
import { ParsedAssetsDictByChain, ParsedUserAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { AddressAssetsReceivedMessage } from '@/__swaps__/types/refraction';
import { RainbowError, logger } from '@/logger';

import { parseUserAssets, userAssetsQueryKey } from './userAssets';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { ADDYS_API_KEY } from 'react-native-dotenv';

const addysHttp = new RainbowFetchClient({
  baseURL: 'https://addys.p.rainbow.me/v3',
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

// ///////////////////////////////////////////////
// Query Types

export type UserAssetsByChainArgs = {
  address: Address | string;
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

async function userAssetsByChainQueryFunction({
  queryKey: [{ address, chainId, currency }],
}: QueryFunctionArgs<typeof userAssetsByChainQueryKey>): Promise<Record<string, ParsedUserAsset>> {
  const cache = queryClient.getQueryCache();
  const cachedUserAssets = (cache.find(userAssetsQueryKey({ address, currency }))?.state?.data || {}) as ParsedAssetsDictByChain;
  const cachedDataForChain = cachedUserAssets?.[chainId] || {};
  try {
    const url = `/${chainId}/${address}/assets`;
    const res = await addysHttp.get<AddressAssetsReceivedMessage>(url, {
      params: {
        currency: currency.toLowerCase(),
      },
    });
    const chainIdsInResponse = res?.data?.meta?.chain_ids || [];
    const assets = res?.data?.payload?.assets?.filter(asset => !asset.asset.defi_position) || [];
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
    logger.error(new RainbowError(`[userAssetsByChainQueryFunction]: Failed to fetch user assets for ${chainId}`), {
      message: (e as Error)?.message,
    });
    return cachedDataForChain;
  }
}

type UserAssetsByChainResult = QueryFunctionResult<typeof userAssetsByChainQueryFunction>;
