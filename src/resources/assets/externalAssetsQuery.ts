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
import { ethereumUtils } from '@/utils';
import { Network } from '@/networks/types';

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
  network: Network;
  currency: NativeCurrencyKey;
};

// Query Key for Token Price
export const ExternalTokenQueryKey = ({
  address,
  network,
  currency,
}: ExternalTokenArgs) =>
  createQueryKey(
    'externalToken',
    { address, network, currency },
    { persisterVersion: 1 }
  );

type ExternalTokenQueryKey = ReturnType<typeof ExternalTokenQueryKey>;

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
  network,
  currency,
}: ExternalTokenArgs) {
  const chainId = ethereumUtils.getChainIdFromNetwork(network);
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
  queryKey: [{ address, network, currency }],
}: QueryFunctionArgs<
  typeof ExternalTokenQueryKey
>): Promise<FormattedExternalAsset | null> {
  if (!address || !network) return null;
  return await fetchExternalToken({ address, network, currency });
}

// Prefetch function for Token Price
export async function prefetchExternalToken({
  address,
  network,
  currency,
}: ExternalTokenArgs) {
  queryClient.prefetchQuery(
    ExternalTokenQueryKey({ address, network, currency }),
    async () => fetchExternalToken({ address, network, currency }),
    {
      staleTime: 60000,
    }
  );
}

// Query Hook for Token Price
export function useExternalToken({
  address,
  network,
  currency,
}: ExternalTokenArgs) {
  return useQuery(
    ExternalTokenQueryKey({ address, network, currency }),
    externalTokenQueryFunction,
    {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      enabled: !!address && !!network,
    }
  );
}
