import { useQuery, useQueryClient } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import useAccountSettings from './useAccountSettings';
import useIsMounted from './useIsMounted';
import { applyENSMetadataFallbackToTokens } from '@/parsers/uniqueTokens';
import { UniqueAsset } from '@/entities';
import { fetchEnsTokens } from '@/handlers/ens';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@/handlers/localstorage/accountLocal';
import {
  apiGetAccountUniqueTokens,
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@/handlers/opensea-api';
import { fetchPoaps } from '@/handlers/poap';
import { Network } from '@/helpers/networkTypes';
<<<<<<< Updated upstream
import { getNftsByWalletAddress } from '@/handlers/simplehash';
=======
import { getNftsByWalletAddressStart } from '@/handlers/simplehash';
>>>>>>> Stashed changes

export const uniqueTokensQueryKey = ({ address }: { address?: string }) => [
  'unique-tokens',
  address,
];

export default function useFetchUniqueTokens({
  address,
  infinite = false,
  staleTime = 0,
}: {
  address?: string;
  infinite?: boolean;
  staleTime?: number;
}) {
  const { network } = useAccountSettings();
  const mounted = useIsMounted();

  const [shouldFetchMore, setShouldFetchMore] = useState<boolean>();
  const [localCursor, setCursor] = useState<string>();

  // Get unique tokens from device storage
  const [hasStoredTokens, setHasStoredTokens] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const { hasStoredTokens } = await getStoredUniqueTokens({
          address,
          network,
        });
        setHasStoredTokens(hasStoredTokens);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    })();
  }, [address, network]);

  // Make the first query to retrieve the unique tokens.
  const uniqueTokensQuery = useQuery<UniqueAsset[]>(
    uniqueTokensQueryKey({ address }),
    async () => {
      if (!address) return [];

      const { storedTokens, hasStoredTokens } = await getStoredUniqueTokens({
        address,
        network,
      });

<<<<<<< Updated upstream
      let uniqueTokens = storedTokens;
      if (!hasStoredTokens) {
        uniqueTokens = await getNftsByWalletAddress(address)
=======
      let uniqueTokens = [];
      if (true) {
        const res = await getNftsByWalletAddressStart({walletAddress: address, cursor: 'start'});
        console.log('start + cursor: ', res?.cursor);
        setCursor(res?.cursor);
        uniqueTokens = res?.nfts;
>>>>>>> Stashed changes
      }

      // If there are any "unknown" ENS names, fallback to the ENS
      // metadata service.
      uniqueTokens = await applyENSMetadataFallbackToTokens(uniqueTokens);

      return uniqueTokens;
    },
    {
      enabled: Boolean(address),
      onSuccess: () =>
        shouldFetchMore === undefined ? setShouldFetchMore(true) : null,
      staleTime,
    }
  );
  const uniqueTokens = uniqueTokensQuery.data;

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!address) return;

    async function fetchMore({
      network,
      uniqueTokens = [],
      cursor = undefined,
    }: {
      network: Network;
      uniqueTokens?: UniqueAsset[];
      cursor?: string;
    }): Promise<UniqueAsset[]> {
      if (
        mounted.current &&
        uniqueTokens?.length < UNIQUE_TOKENS_LIMIT_TOTAL &&
        cursor &&
        address
      ) {
<<<<<<< Updated upstream
        let moreUniqueTokens = await getNftsByWalletAddress(address as string);
=======
 
     
        const res = await getNftsByWalletAddressStart({walletAddress: address, cursor})
        let moreUniqueTokens = res?.nfts || [];
        console.log('more unique tokens: ', moreUniqueTokens.length);
        console.log('total: ', uniqueTokens.length)

        const newCursor = res?.cursor;
>>>>>>> Stashed changes

        // If there are any "unknown" ENS names, fallback to the ENS
        // metadata service.
        moreUniqueTokens = await applyENSMetadataFallbackToTokens(
          moreUniqueTokens
        );

        if (!hasStoredTokens && moreUniqueTokens.length) {
          console.log('saving more')

          queryClient.setQueryData<UniqueAsset[]>(
            uniqueTokensQueryKey({ address }),
        
            tokens =>
            tokens
              ? uniqBy([...tokens, ...moreUniqueTokens], 'uniqueId')
              : moreUniqueTokens
          );
        }
<<<<<<< Updated upstream
=======
        return fetchMore({
          network,
          cursor: newCursor,
          uniqueTokens: uniqBy([...uniqueTokens, ...moreUniqueTokens], 'uniqueId'),
        });
>>>>>>> Stashed changes
      }
      console.log('FIN');
      console.log('total tokens: ', uniqueTokens.length)
      return uniqueTokens;
    }

    // We have already fetched the first page of results – so let's fetch more!
    if (
      infinite &&
      shouldFetchMore &&
      uniqueTokens &&
      uniqueTokens.length > 0 
    ) {
      setShouldFetchMore(false);

      (async () => {
        // Fetch more tokens until all have fetched
        console.log('fetchignn moarrr : ', localCursor);
        let tokens = (
          await fetchMore({
            network,
            // If there are stored tokens in storage, then we want
            // to do a background refresh.
            cursor: 'start',
            uniqueTokens: uniqueTokens,
          })
        );

        // Fetch recently registered ENS tokens (OpenSea doesn't recognize these for a while).
        // We will fetch tokens registered in the past 48 hours to be safe.
        const ensTokens = await fetchEnsTokens({
          address,
          timeAgo: { hours: 48 },
        });
        if (ensTokens.length > 0) {
          tokens = uniqBy([...tokens, ...ensTokens], 'uniqueId');
        }
        console.log('4');
        if (hasStoredTokens) {
          queryClient.setQueryData<UniqueAsset[]>(
            uniqueTokensQueryKey({ address }),
            tokens
          );
        }
        console.log('FIUNN 2')
        console.log('total tokens: ', tokens.length);
        await saveUniqueTokens(tokens, address, network);
      })();
    }
  }, [address, shouldFetchMore, network, uniqueTokens, queryClient, hasStoredTokens, infinite, mounted, localCursor]);

  return uniqueTokensQuery;
}

async function getStoredUniqueTokens({
  address,
  network,
}: {
  address?: string;
  network: Network;
}) {
  const storedTokens = await getUniqueTokens(address, network);
  const hasStoredTokens = storedTokens && storedTokens.length > 0;
  return {
    hasStoredTokens,
    storedTokens,
  };
}
