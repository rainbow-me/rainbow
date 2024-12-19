import { useQuery } from '@tanstack/react-query';
import { NativeCurrencyKey } from '@/entities';
import { metadataClient } from '@/graphql';
import { Token } from '@/graphql/__generated__/metadata';
import { ChainId } from '@/state/backendNetworks/types';

// Types
type TokenMetadata = Pick<
  Token,
  'description' | 'volume1d' | 'marketCap' | 'totalSupply' | 'circulatingSupply' | 'fullyDilutedValuation' | 'links'
>;

// Types for the query arguments
type AdditionalAssetDataArgs = {
  address: string;
  chainId: ChainId;
  currency: NativeCurrencyKey;
};

// Query Key function
const createAdditionalAssetDataQueryKey = ({ address, chainId, currency }: AdditionalAssetDataArgs) => [
  'additionalAssetData',
  address,
  chainId,
  currency,
];

// Refactor the getAdditionalAssetData function to accept the new parameters
async function getAdditionalAssetData({ address, chainId, currency }: AdditionalAssetDataArgs): Promise<TokenMetadata | null> {
  const data = await metadataClient.tokenMetadata({
    address,
    chainId,
    currency,
  });

  if (data.token) {
    return data.token as TokenMetadata;
  }
  return null;
}

// Usage of the useQuery hook
export default function useAdditionalAssetData({ address, chainId, currency }: AdditionalAssetDataArgs) {
  return useQuery<TokenMetadata | null>(
    createAdditionalAssetDataQueryKey({ address, chainId, currency }),
    () => getAdditionalAssetData({ address, chainId, currency }),
    {
      enabled: !!address && !!chainId && !!currency, // Ensure all parameters are provided
    }
  );
}
