import { useQuery } from '@tanstack/react-query';

import { requestMetadata } from '@/graphql';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { SupportedCurrencyKey } from '@/references';
import { AddressOrEth, AssetMetadata, ParsedAsset, UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { chunkArray, createAssetQuery, parseAssetMetadata } from '@/__swaps__/utils/assets';
import { RainbowError, logger } from '@/logger';
export const ASSETS_TIMEOUT_DURATION = 10000;
const ASSETS_REFETCH_INTERVAL = 60000;

// ///////////////////////////////////////////////
// Query Types

export type AssetsQueryArgs = {
  assetAddresses: AddressOrEth[];
  chainId: ChainId;
  currency: SupportedCurrencyKey;
};

// ///////////////////////////////////////////////
// Query Key

const assetsQueryKey = ({ assetAddresses, chainId, currency }: AssetsQueryArgs) =>
  createQueryKey('assets', { assetAddresses, chainId, currency }, { persisterVersion: 2 });

type AssetsQueryKey = ReturnType<typeof assetsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

export async function assetsQueryFunction({
  queryKey: [{ assetAddresses, chainId, currency }],
}: QueryFunctionArgs<typeof assetsQueryKey>): Promise<{
  [key: UniqueId]: ParsedAsset;
}> {
  try {
    if (!assetAddresses || !assetAddresses.length) return {};
    const batches = chunkArray([...assetAddresses], 10); // chunking because a full batch would throw 413
    const batchQueries = batches.map(batchedQuery => createAssetQuery(batchedQuery, chainId, currency, true), {
      timeout: ASSETS_TIMEOUT_DURATION,
    });

    const batchResults = batchQueries.map(query => requestMetadata(query)) as Promise<Record<string, AssetMetadata>[]>[];
    const results = (await Promise.all(batchResults))
      .flat()
      .map(r => Object.values(r))
      .flat();
    const parsedAssets = parseAssets(results, chainId, currency);
    return parsedAssets;
  } catch (e) {
    logger.error(new RainbowError('assetsQueryFunction: '), {
      message: (e as Error)?.message,
    });
    return {};
  }
}

type AssetsQueryResult = QueryFunctionResult<typeof assetsQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchAssets(
  { assetAddresses, chainId, currency }: AssetsQueryArgs,
  config: QueryConfigWithSelect<AssetsQueryResult, Error, AssetsQueryResult, AssetsQueryKey> = {}
) {
  return await queryClient.fetchQuery(assetsQueryKey({ assetAddresses, chainId, currency }), assetsQueryFunction, config);
}

function parseAssets(assets: AssetMetadata[], chainId: ChainId, currency: SupportedCurrencyKey) {
  return assets.reduce(
    (assetsDict, asset) => {
      const address = asset.networks?.[chainId]?.address;
      if (address) {
        const parsedAsset = parseAssetMetadata({
          address,
          asset,
          chainId,
          currency,
        });
        assetsDict[parsedAsset?.uniqueId] = parsedAsset;
      }
      return assetsDict;
    },
    {} as Record<UniqueId, ParsedAsset>
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useAssets<TSelectData = AssetsQueryResult>(
  { assetAddresses, chainId, currency }: AssetsQueryArgs,
  config: QueryConfigWithSelect<AssetsQueryResult, Error, TSelectData, AssetsQueryKey> = {}
) {
  return useQuery(assetsQueryKey({ assetAddresses, chainId, currency }), assetsQueryFunction, {
    ...config,
    refetchInterval: ASSETS_REFETCH_INTERVAL,
  });
}
