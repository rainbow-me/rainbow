import { useQuery } from '@tanstack/react-query';
import { metadataClient } from '@/graphql';
import { QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplay,
} from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities';
import { Token } from '@/graphql/__generated__/metadata';

// Types
type ExternalToken = Pick<
  Token,
  'decimals' | 'iconUrl' | 'name' | 'networks' | 'symbol' | 'colors' | 'price'
>;
export type FormattedExternalAsset = ExternalToken & {
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
  chainId: number;
  currency: NativeCurrencyKey;
};

// Query Key for Token Price
export const TokenPriceQueryKey = ({
  address,
  chainId,
  currency,
}: ExternalTokenArgs) =>
  createQueryKey(
    'externalToken',
    { address, chainId, currency },
    { persisterVersion: 1 }
  );

type TokenPriceQueryKey = ReturnType<typeof TokenPriceQueryKey>;

// Helpers
const formatExternalAsset = (
  asset: ExternalToken,
  nativeCurrency: NativeCurrencyKey
): FormattedExternalAsset => {
  return {
    ...asset,
    native: {
      change: asset?.price?.relativeChange24h
        ? convertAmountToPercentageDisplay(`${asset?.price?.relativeChange24h}`)
        : '',
      price: convertAmountAndPriceToNativeDisplay(
        1,
        asset?.price?.value || 0,
        nativeCurrency
      ),
    },
  };
};

// Query Function for Token Price
export async function fetchExternalToken({
  address,
  chainId,
  currency,
}: ExternalTokenArgs) {
  const response = await metadataClient.externalToken({
    address,
    chainId,
    currency,
  });
  console.log('res: ', response.token);
  if (response.token) {
    return formatExternalAsset(response.token, currency);
  } else {
    return null;
  }
}

export async function externalTokenQueryFunction({
  queryKey: [{ address, chainId, currency }],
}: QueryFunctionArgs<
  typeof TokenPriceQueryKey
>): Promise<FormattedExternalAsset | null> {
  if (!address || !chainId) return null;
  return await fetchExternalToken({ address, chainId, currency });
}

// Prefetch function for Token Price
export async function prefetchExternalToken({
  address,
  chainId,
  currency,
}: ExternalTokenArgs) {
  queryClient.prefetchQuery(
    TokenPriceQueryKey({ address, chainId, currency }),
    async () => fetchExternalToken({ address, chainId, currency }),
    {
      staleTime: 60000,
    }
  );
}

// Query Hook for Token Price
export function useExternalToken({
  address,
  chainId,
  currency,
}: ExternalTokenArgs) {
  return useQuery(
    TokenPriceQueryKey({ address, chainId, currency }),
    externalTokenQueryFunction,
    {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      enabled: !!address && !!chainId,
    }
  );
}
