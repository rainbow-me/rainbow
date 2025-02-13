import { metadataClient } from '@/graphql';
import { NativeCurrencyKey } from '@/entities';
import { Token } from '@/graphql/__generated__/metadata';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { logger, RainbowError } from '@/logger';

// Types
export type TokenMetadata = Pick<
  Token,
  'description' | 'volume1d' | 'marketCap' | 'totalSupply' | 'circulatingSupply' | 'fullyDilutedValuation' | 'links'
>;

type TokenMetadataParams = {
  address: string;
  chainId: ChainId;
  currency: NativeCurrencyKey;
};

export const useTokenMetadataStore = createQueryStore<TokenMetadata | null, TokenMetadataParams>(
  {
    fetcher: (params: TokenMetadataParams) => fetchTokenMetadata(params),
    cacheTime: time.weeks(1),
    enabled: false, // TODO: Remove once this store is ready to be used
    keepPreviousData: true,
    params: {
      address: '',
      chainId: ChainId.mainnet,
      currency: 'USD',
    },
    staleTime: time.minutes(30),
  },
  () => ({
    metadata: null,
  })
  // { storageKey: 'tokenMetadata' } // TODO: Uncomment once this store is ready to be used
);

async function fetchTokenMetadata({ address, chainId, currency }: TokenMetadataParams): Promise<TokenMetadata | null> {
  try {
    const data = await metadataClient.tokenMetadata({
      address,
      chainId,
      currency,
    });

    if (data.token) return data.token as TokenMetadata;

    return null;
  } catch (e: unknown) {
    logger.error(new RainbowError('[tokenMetadata]: Failed to fetch token metadata'), {
      message: e instanceof Error ? e.message : 'Unknown error',
    });
    return null;
  }
}
