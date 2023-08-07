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
import { useQuery } from '@tanstack/react-query';
import { parseAddressAsset } from './assets';
import { AddysAccountAssetsResponse, RainbowAddressAssets } from './types';

// ///////////////////////////////////////////////
// Query Types

export type UserAssetsArgs = {
  address?: string; // Address;
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
    const parsedResults = parseUserAssetsByChain(data);

    // Temporary: update data redux with address assets
    const { dispatch } = store;
    dispatch({
      payload: parsedResults,
      type: DATA_LOAD_ACCOUNT_ASSETS_DATA_SUCCESS,
    });

    return parsedResults;
  } catch (e) {
    return cachedAddressAssets;
  }
}

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
