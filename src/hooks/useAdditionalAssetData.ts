import { useQuery } from '@tanstack/react-query';
import { NativeCurrencyKey } from '@/entities';
import { Network } from '@/networks/types';
import { metadataClient } from '@/graphql';
import { ethereumUtils } from '@/utils';
import { Token } from '@/graphql/__generated__/metadata';

// Types
type TokenMetadata = Pick<
  Token,
  'description' | 'volume1d' | 'marketCap' | 'totalSupply' | 'circulatingSupply' | 'fullyDilutedValuation' | 'links'
>;

// Types for the query arguments
type AdditionalAssetDataArgs = {
  address: string;
  network: Network;
  currency: NativeCurrencyKey;
};

// Query Key function
const createAdditionalAssetDataQueryKey = ({ address, network, currency }: AdditionalAssetDataArgs) => [
  'additionalAssetData',
  address,
  network,
  currency,
];

// Refactor the getAdditionalAssetData function to accept the new parameters
async function getAdditionalAssetData({ address, network, currency }: AdditionalAssetDataArgs): Promise<TokenMetadata | null> {
  const chainId = ethereumUtils.getChainIdFromNetwork(network);
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
export default function useAdditionalAssetData({ address, network, currency }: AdditionalAssetDataArgs) {
  return useQuery<TokenMetadata | null>(
    createAdditionalAssetDataQueryKey({ address, network, currency }),
    () => getAdditionalAssetData({ address, network, currency }),
    {
      enabled: !!address && !!network && !!currency, // Ensure all parameters are provided
    }
  );
}
