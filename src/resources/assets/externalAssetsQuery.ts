import { useQuery } from '@tanstack/react-query';
import { metadataClient } from '@/graphql';
import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';
import { convertAmountAndPriceToNativeDisplay, convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities';
import { Token } from '@/graphql/__generated__/metadata';
import { ethereumUtils } from '@/utils';
import { ChainId } from '@/__swaps__/types/chains';

export const EXTERNAL_TOKEN_CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours
export const EXTERNAL_TOKEN_STALE_TIME = 1000 * 60; // 1 minute

// need to keep these queried tokens up to date
//   ETH_ADDRESS,
// MATIC_MAINNET_ADDRESS,
// BNB_MAINNET_ADDRESS,
// OP_ADDRESS

// Types
type ExternalToken = Pick<Token, 'decimals' | 'iconUrl' | 'name' | 'networks' | 'symbol' | 'colors' | 'price'>;
export type FormattedExternalAsset = ExternalToken & {
  icon_url?: string;
  native: {
    change: string;
    price: {
      amount: string;
      display: string;
    };
  };
};

// Query Types for External Token
type ExternalTokenArgs = {
  address: string;
  chainId: ChainId;
  currency: NativeCurrencyKey;
};

// Query Key for Token Price
export const externalTokenQueryKey = ({ address, chainId, currency }: ExternalTokenArgs) =>
  createQueryKey('externalToken', { address, chainId, currency }, { persisterVersion: 1 });

type externalTokenQueryKey = ReturnType<typeof externalTokenQueryKey>;

// Helpers
const formatExternalAsset = (asset: ExternalToken, nativeCurrency: NativeCurrencyKey): FormattedExternalAsset => {
  return {
    ...asset,
    native: {
      change: asset?.price?.relativeChange24h ? convertAmountToPercentageDisplay(`${asset?.price?.relativeChange24h}`) : '',
      price: convertAmountAndPriceToNativeDisplay(1, asset?.price?.value || 0, nativeCurrency),
    },
    icon_url: asset?.iconUrl || undefined,
  };
};

// Query Function for Token Price
export async function fetchExternalToken({ address, chainId, currency }: ExternalTokenArgs) {
  const response = await metadataClient.externalToken({
    address,
    chainId,
    currency,
  });
  if (response.token) {
    return formatExternalAsset(response.token, currency);
  } else {
    return null;
  }
}

export async function externalTokenQueryFunction({
  queryKey: [{ address, chainId, currency }],
}: QueryFunctionArgs<typeof externalTokenQueryKey>): Promise<FormattedExternalAsset | null> {
  if (!address || !chainId) return null;
  return await fetchExternalToken({ address, chainId, currency });
}

export type ExternalTokenQueryFunctionResult = QueryFunctionResult<typeof externalTokenQueryFunction>;

// Prefetch function for Token Price
export async function prefetchExternalToken({ address, chainId, currency }: ExternalTokenArgs) {
  await queryClient.prefetchQuery(
    externalTokenQueryKey({ address, chainId, currency }),
    async () => await fetchExternalToken({ address, chainId, currency }),
    {
      staleTime: EXTERNAL_TOKEN_STALE_TIME,
      cacheTime: EXTERNAL_TOKEN_CACHE_TIME,
    }
  );
}

// Query Hook for Token Price
export function useExternalToken(
  { address, chainId, currency }: ExternalTokenArgs,
  config: QueryConfig<ExternalTokenQueryFunctionResult, Error, externalTokenQueryKey> = {}
) {
  return useQuery(externalTokenQueryKey({ address, chainId, currency }), externalTokenQueryFunction, {
    staleTime: EXTERNAL_TOKEN_STALE_TIME,
    cacheTime: EXTERNAL_TOKEN_CACHE_TIME,
    enabled: !!address && !!chainId,
    ...config,
  });
}
