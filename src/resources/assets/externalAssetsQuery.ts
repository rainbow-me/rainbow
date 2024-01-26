import { useQuery } from '@tanstack/react-query';
import { metadataClient } from '@/graphql';
import { QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities';

// Query Types for External Token
type ExternalTokenArgs = {
  address: string;
  chainId: number;
  currency: NativeCurrencyKey;
};

// Query Key for Token Price
const TokenPriceQueryKey = ({
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

// Query Function for Token Price
export async function fetchExternalToken({
  address,
  chainId,
  currency,
}: ExternalTokenArgs) {
  console.log('fetchingExternalToken: ', { address, chainId, currency });
  const response = await metadataClient.externalToken({
    address,
    chainId,
    currency,
  });
  console.log('res: ', response.token);

  return {
    ...response.token,
    ...(response?.token?.price?.value && {
      native: convertAmountToNativeDisplay(
        response?.token?.price?.value,
        currency
      ),
    }),
  };
}

export async function externalTokenQueryFunction({
  queryKey: [{ address, chainId, currency }],
}: QueryFunctionArgs<typeof TokenPriceQueryKey>): Promise<any> {
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
