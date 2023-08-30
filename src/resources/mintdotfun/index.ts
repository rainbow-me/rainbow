import { analyticsV2 } from '@/analytics';
import {
  Filter,
  mintDotFunFilterAtom,
} from '@/components/cards/MintDotFunCard/Menu';
import { MINT_DOT_FUN, useExperimentalFlag } from '@/config';
import { IS_PROD } from '@/env';
import { arcClient, arcDevClient } from '@/graphql';
import { GetMintableCollectionsQuery } from '@/graphql/__generated__/arc';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { useRecoilValue } from 'recoil';

const graphqlClient = IS_PROD ? arcClient : arcDevClient;

export const mintableCollectionsQueryKey = ({ address }: { address: string }) =>
  createQueryKey('mintableCollections', { address }, { persisterVersion: 1 });

/**
 * React Query hook that returns the the most profitable `NftOffer` for each NFT owned by the given wallet address.
 * @param walletAddress The wallet address to query for.
 * @param sortBy How the offers should be sorted. Defaults to `SortCriterion.TopBidValue`.
 * @returns an NftOffer[] located at `returnValue.data.nftOffers`.
 */
export function useMintableCollections({
  walletAddress,
  chainId,
}: {
  walletAddress: string;
  chainId: number;
}) {
  const mintDotFunEnabled = useExperimentalFlag(MINT_DOT_FUN);
  const filter = useRecoilValue(mintDotFunFilterAtom);
  const queryKey = mintableCollectionsQueryKey({
    address: walletAddress,
  });

  const query = useQuery<GetMintableCollectionsQuery>(
    queryKey,
    async () =>
      await graphqlClient.getMintableCollections({
        walletAddress,
        chain: chainId,
      }),
    {
      enabled: mintDotFunEnabled && !!walletAddress,
      staleTime: 300_000, // 5 minutes
      cacheTime: 1_800_000, // 30 minutes
      refetchInterval: 600_000, // 10 minutes
    }
  );

  let filteredMints;
  switch (filter) {
    case Filter.Free:
      filteredMints = query.data?.getMintableCollections?.collections.filter(
        collection => collection.mintStatus.price === '0'
      );
      break;
    case Filter.Paid:
      filteredMints = query.data?.getMintableCollections?.collections.filter(
        collection => collection.mintStatus.price !== '0'
      );
      break;
    case Filter.All:
    default:
      filteredMints = query.data?.getMintableCollections?.collections;
      break;
  }

  return {
    ...query,
    data: {
      ...query.data,
      getMintableCollections: {
        ...query.data?.getMintableCollections,
        collections: filteredMints,
      },
    },
  };
}
