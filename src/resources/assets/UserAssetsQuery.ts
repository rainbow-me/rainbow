import isEmpty from 'lodash/isEmpty';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { NativeCurrencyKey } from '@/entities';
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
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';
import { RainbowPositions } from '@/resources/defi/types';
import { useQuery } from '@tanstack/react-query';
import { hideTokensWithUrls, parseAddressAsset } from './assets';
import { fetchHardhatBalances } from './hardhatAssets';
import { AddysAccountAssetsResponse, RainbowAddressAssets } from './types';

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

async function userAssetsQueryFunction({
  queryKey: [{ address, currency, connectedToHardhat }],
}: QueryFunctionArgs<typeof userAssetsQueryKey>) {
  const cache = queryClient.getQueryCache();
  const cachedAddressAssets = (cache.find(
    userAssetsQueryKey({ address, currency, connectedToHardhat })
  )?.state?.data || {}) as RainbowAddressAssets;

  const { dispatch } = store;

  if (connectedToHardhat) {
    const parsedTestnetOrHardhatResults = await fetchHardhatBalances(address);
    // Temporary: update data redux with address assets
    dispatch({
      payload: parsedTestnetOrHardhatResults,
      type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
    });
    return parsedTestnetOrHardhatResults;
  }

  try {
    const chainIds = RainbowNetworks.filter(
      network => network.enabled && network.networkType !== 'testnet'
    ).map(network => network.id);
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
    const data = response.data;
    let parsedSuccessResults = parseUserAssetsByChain(data);

    // filter out positions data
    const positionsObj: RainbowPositions | undefined = queryClient.getQueryData(
      positionsQueryKey({ address, currency })
    );
    const positionTokens = positionsObj?.positionTokens || [];
    if (!isEmpty(positionTokens)) {
      parsedSuccessResults = Object.keys(parsedSuccessResults)
        .filter(
          uniqueId =>
            !positionTokens.find(positionToken => positionToken === uniqueId)
        )
        .reduce((cur, uniqueId) => {
          return Object.assign(cur, {
            [uniqueId]: parsedSuccessResults[uniqueId],
          });
        }, {});
    }

    // grab cached data for chain IDs with errors
    const erroredChainIds = data?.meta?.chain_ids_with_errors;
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
    }

    // add tokens with URLs to hidden list
    hideTokensWithUrls(parsedSuccessResults, address);

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

const retryErroredChainIds = (chainsWithErrors: number[]) => {
  // TODO JIN: retry for errored chainIds
};

type UserAssetsResult = QueryFunctionResult<typeof userAssetsQueryFunction>;

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
    config
  );
}
