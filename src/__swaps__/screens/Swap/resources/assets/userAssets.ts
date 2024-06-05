import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';
import { ADDYS_API_KEY } from 'react-native-dotenv';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import {
  SupportedCurrencyKey,
  SUPPORTED_CHAIN_IDS,
  chainAssets,
  ETH_ADDRESS,
  balanceCheckerContractAbi,
  SUPPORTED_CHAINS,
} from '@/references';
import { AddressOrEth, ParsedAssetsDictByChain, ZerionAsset } from '@/__swaps__/types/assets';
import { ChainId, ChainName } from '@/__swaps__/types/chains';
import { AddressAssetsReceivedMessage } from '@/__swaps__/types/refraction';
import { filterAsset, parseUserAsset } from '@/__swaps__/utils/assets';
import { greaterThan } from '@/__swaps__/utils/numbers';
import { RainbowError, logger } from '@/logger';

import { fetchUserAssetsByChain } from './userAssetsByChain';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { web3Provider } from '@/handlers/web3';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { getNetworkObj } from '@/networks';
import ethereumUtils, { getNetworkFromChainId } from '@/utils/ethereumUtils';

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
  address?: Address;
  currency: SupportedCurrencyKey;
  testnetMode?: boolean;
};

type SetUserAssetsArgs = {
  address?: Address;
  currency: SupportedCurrencyKey;
  userAssets?: UserAssetsResult;
  testnetMode?: boolean;
};

type SetUserDefaultsArgs = {
  address?: Address;
  currency: SupportedCurrencyKey;
  staleTime: number;
  testnetMode?: boolean;
};

type FetchUserAssetsArgs = {
  address?: Address;
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

const fetchHardhatBalancesWithBalanceChecker = async ({
  tokenAddress,
  userAddress,
  chainId,
}: {
  tokenAddress: string;
  userAddress: Address;
  chainId: ChainId;
}): Promise<string | null> => {
  const balanceCheckerContract = new Contract(
    getNetworkObj(getNetworkFromChainId(chainId)).balanceCheckerAddress,
    balanceCheckerContractAbi,
    web3Provider
  );
  try {
    const values = await balanceCheckerContract.balances([userAddress], [tokenAddress]);
    const [balance] = values;
    return balance.toString();
  } catch (e) {
    logger.error(new RainbowError(`Fetching balances from balanceCheckerContract failed for chainId: ${chainId}`), {
      message: (e as Error)?.message,
    });
    return null;
  }
};

export const fetchHardhatBalances = async ({
  address,
  currency,
}: {
  address: Address;
  currency: SupportedCurrencyKey;
}): Promise<ParsedAssetsDictByChain> => {
  if (!address) {
    return {};
  }

  const parsedAssetsDict: ParsedAssetsDictByChain = {};

  for (const [networkName, assets] of Object.entries(chainAssets)) {
    for (const { asset } of assets) {
      const chain = SUPPORTED_CHAINS({ testnetMode: true }).find(chain => {
        return chain.name.toLowerCase() === asset.name.toLowerCase();
      });

      if (!chain?.id) continue;

      if (!parsedAssetsDict[chain.id]) {
        parsedAssetsDict[chain.id] = {};
      }

      const assetCode = asset.asset_code.toLowerCase();

      const balance = await fetchHardhatBalancesWithBalanceChecker({
        tokenAddress: assetCode === ETH_ADDRESS ? AddressZero : assetCode,
        userAddress: address,
        chainId: chain.id,
      });

      if (!balance) continue;

      const chainAsset = {
        asset: {
          ...asset,
          network: ethereumUtils.getNetworkFromChainId(chain.id),
          chainId: chain.id,
        },
        quantity: balance,
      };

      const parsedAsset = parseUserAsset({
        asset: {
          ...chainAsset.asset,
          bridging: {} as never,
          asset_code: chainAsset.asset.asset_code as AddressOrEth,
          network: networkName as ChainName,
        },
        currency,
        balance,
        smallBalance: false,
      });

      parsedAssetsDict[chain.id][parsedAsset.uniqueId] = parsedAsset;
    }
  }

  return parsedAssetsDict;
};

async function userAssetsQueryFunction({
  queryKey: [{ address, currency, testnetMode }],
  ...rest
}: QueryFunctionArgs<typeof userAssetsQueryKey>) {
  if (!address) {
    return {};
  }
  const cache = queryClient.getQueryCache();
  const cachedUserAssets = (cache.find(userAssetsQueryKey({ address, currency, testnetMode }))?.state?.data ||
    {}) as ParsedAssetsDictByChain;

  if (testnetMode) {
    const parsedTestnetResults = await fetchHardhatBalances({ address, currency });
    return parsedTestnetResults;
  }

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
    logger.error(new RainbowError('userAssetsQueryFunction: '), {
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
  address: Address;
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
    logger.error(new RainbowError('userAssetsQueryFunctionRetryByChain: '), {
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
    if (!filterAsset(asset) && greaterThan(quantity, 0)) {
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
  { address, currency, testnetMode }: UserAssetsArgs,
  config: QueryConfigWithSelect<UserAssetsResult, Error, TSelectResult, UserAssetsQueryKey> = {}
) {
  return useQuery(userAssetsQueryKey({ address, currency, testnetMode }), userAssetsQueryFunction, {
    ...config,
    refetchInterval: USER_ASSETS_REFETCH_INTERVAL,
    staleTime: process.env.IS_TESTING === 'true' ? 0 : 1000,
  });
}
