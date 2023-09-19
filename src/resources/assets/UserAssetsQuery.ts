import isEmpty from 'lodash/isEmpty';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { NativeCurrencyKey } from '@/entities';
import { saveAccountEmptyState } from '@/handlers/localstorage/accountLocal';
import { Network } from '@/helpers/networkTypes';
import { greaterThan } from '@/helpers/utilities';
import { RainbowNetworks } from '@/networks';
import { rainbowFetch } from '@/rainbow-fetch';
import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionArgs,
  QueryFunctionResult,
} from '@/react-query';
import { DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS } from '@/redux/data';
import store from '@/redux/store';
import { useQuery } from '@tanstack/react-query';
import {
  filterPositionsData,
  hideTokensWithUrls,
  parseAddressAsset,
} from './assets';
import { fetchHardhatBalances } from './hardhatAssets';
import {
  AddysAccountAssetsMeta,
  AddysAccountAssetsResponse,
  RainbowAddressAssets,
} from './types';

// ///////////////////////////////////////////////
// Query Types

export type UserAssetsArgs = {
  address: string; // Address;
  currency: NativeCurrencyKey;
  connectedToHardhat: boolean;
};

// ///////////////////////////////////////////////
// Query Key

export const userAssetsQueryKey = ({
  address,
  currency,
  connectedToHardhat,
}: UserAssetsArgs) =>
  createQueryKey(
    'userAssets',
    { address, currency, connectedToHardhat },
    { persisterVersion: 1 }
  );

type UserAssetsQueryKey = ReturnType<typeof userAssetsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

const fetchUserAssetsForChainIds = async (
  address: string,
  currency: NativeCurrencyKey,
  chainIds: number[]
) => {
  const chainIdsString = chainIds.join(',');
  const url = `https://addys.p.rainbow.me/v3/${chainIdsString}/${address}/assets`;

  const response = await rainbowFetch(url, {
    method: 'get',
    params: {
      currency: currency.toLowerCase(),
    },
    headers: {
      Authorization: `Bearer ${ADDYS_API_KEY}`,
    },
  });

  return response.data;
};

async function userAssetsQueryFunction({
  queryKey: [{ address, currency, connectedToHardhat }],
}: QueryFunctionArgs<typeof userAssetsQueryKey>) {
  const cache = queryClient.getQueryCache();
  const cachedAddressAssets = (cache.find(
    userAssetsQueryKey({ address, currency, connectedToHardhat })
  )?.state?.data || {}) as RainbowAddressAssets;

  const { dispatch } = store;

  if (connectedToHardhat) {
    const parsedHardhatResults = await fetchHardhatBalances(address);
    // Temporary: update data redux with address assets
    dispatch({
      payload: parsedHardhatResults,
      type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
    });
    return parsedHardhatResults;
  }

  try {
    const chainIds = RainbowNetworks.filter(
      network => network.enabled && network.networkType !== 'testnet'
    ).map(network => network.id);

    const {
      erroredChainIds,
      results,
    } = await fetchAndParseUserAssetsForChainIds(address, currency, chainIds);
    let parsedSuccessResults = results;

    // grab cached data for chain IDs with errors
    if (!isEmpty(erroredChainIds)) {
      const cachedDataForErroredChainIds = Object.keys(cachedAddressAssets)
        .filter(uniqueId => {
          const cachedAsset = cachedAddressAssets[uniqueId];
          return erroredChainIds?.find(
            (chainId: number) => chainId === cachedAsset.chainId
          );
        })
        .reduce((cur, uniqueId) => {
          return Object.assign(cur, {
            [uniqueId]: cachedAddressAssets[uniqueId],
          });
        }, {});

      parsedSuccessResults = {
        ...parsedSuccessResults,
        ...cachedDataForErroredChainIds,
      };

      retryErroredChainIds(
        address,
        currency,
        connectedToHardhat,
        erroredChainIds
      );
    }

    // Temporary: update data redux with address assets
    dispatch({
      payload: parsedSuccessResults,
      type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
    });

    return parsedSuccessResults;
  } catch (e) {
    return cachedAddressAssets;
  }
}

const retryErroredChainIds = async (
  address: string,
  currency: NativeCurrencyKey,
  connectedToHardhat: boolean,
  erroredChainIds: number[]
) => {
  const { meta, results } = await fetchAndParseUserAssetsForChainIds(
    address,
    currency,
    erroredChainIds
  );
  let parsedSuccessResults = results;
  const successChainIds = meta?.chain_ids;

  if (isEmpty(successChainIds)) {
    return;
  }

  // grab cached data without data that will be replaced
  const cache = queryClient.getQueryCache();
  const cachedAddressAssets = (cache.find(
    userAssetsQueryKey({ address, currency, connectedToHardhat })
  )?.state?.data || {}) as RainbowAddressAssets;

  const cachedData = Object.keys(cachedAddressAssets)
    .filter(uniqueId => {
      const cachedAsset = cachedAddressAssets[uniqueId];
      return successChainIds?.find(
        (chainId: number) => chainId !== cachedAsset.chainId
      );
    })
    .reduce((cur, uniqueId) => {
      return Object.assign(cur, {
        [uniqueId]: cachedAddressAssets[uniqueId],
      });
    }, {});

  parsedSuccessResults = {
    ...cachedData,
    ...parsedSuccessResults,
  };

  const { dispatch } = store;
  dispatch({
    payload: parsedSuccessResults,
    type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
  });
};

type UserAssetsResult = QueryFunctionResult<typeof userAssetsQueryFunction>;

interface AssetsAndMetadata {
  erroredChainIds: number[];
  meta: AddysAccountAssetsMeta;
  results: RainbowAddressAssets;
}

const fetchAndParseUserAssetsForChainIds = async (
  address: string,
  currency: NativeCurrencyKey,
  chainIds: number[]
): Promise<AssetsAndMetadata> => {
  const data = await fetchUserAssetsForChainIds(address, currency, chainIds);
  let parsedSuccessResults = parseUserAssetsByChain(data);

  // filter out positions data
  parsedSuccessResults = filterPositionsData(
    address,
    currency,
    parsedSuccessResults
  );

  // add tokens with URLs to hidden list
  hideTokensWithUrls(parsedSuccessResults, address);

  // update account empty state
  if (!isEmpty(parsedSuccessResults)) {
    saveAccountEmptyState(false, address, Network.mainnet);
  }

  const erroredChainIds = data?.meta?.chain_ids_with_errors;
  return { erroredChainIds, meta: data?.meta, results: parsedSuccessResults };
};

function parseUserAssetsByChain(message: AddysAccountAssetsResponse) {
  return Object.values(message?.payload?.assets || {}).reduce(
    (dict, assetData) => {
      if (greaterThan(assetData?.quantity, 0)) {
        const parsedAsset = parseAddressAsset({
          assetData,
        });
        dict[parsedAsset?.uniqueId] = parsedAsset;
      }
      return dict;
    },
    {} as RainbowAddressAssets
  );
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchUserAssets(
  { address, currency, connectedToHardhat }: UserAssetsArgs,
  config: QueryConfig<UserAssetsResult, Error, UserAssetsQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    userAssetsQueryKey({ address, currency, connectedToHardhat }),
    userAssetsQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useUserAssets(
  { address, currency, connectedToHardhat }: UserAssetsArgs,
  config: QueryConfig<UserAssetsResult, Error, UserAssetsQueryKey> = {}
) {
  return useQuery(
    userAssetsQueryKey({ address, currency, connectedToHardhat }),
    userAssetsQueryFunction,
    {
      staleTime: 60_000, // 1 minute
      refetchInterval: 300_000, // 5 minutes
      ...config,
    }
  );
}
