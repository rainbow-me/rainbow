import { useQuery, useQueryClient } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import useAccountSettings from './useAccountSettings';
import useIsMounted from './useIsMounted';
import {
  applyENSMetadataFallbackToTokens,
  parseSimplehashNFTs,
} from '@/parsers/uniqueTokens';
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
import { fetchRawUniqueTokens, START_CURSOR } from '@/handlers/simplehash';
import { rainbowFetch } from '@/rainbow-fetch';

export const uniqueTokensQueryKey = ({ address }: { address?: string }) => [
  'unique-tokens',
  address,
];

const POLYGON_ALLOWLIST_STALE_TIME = 600000; // 10 minutes
const POAP_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';

export default function useFetchUniqueTokens({
  address,
  infinite = false,
  staleTime = 10000,
}: {
  address?: string;
  infinite?: boolean;
  staleTime?: number;
}) {
  const { network } = useAccountSettings();
  const mounted = useIsMounted();
  const queryClient = useQueryClient();

  const [shouldFetchMore, setShouldFetchMore] = useState<boolean>();
  const [cursor, setCursor] = useState<string | null>(START_CURSOR);
  const [polygonAllowlist, setPolygonAllowlist] = useState<string[]>([]);

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

  useEffect(() => {
    const fetchPolygonAllowlist = async () => {
      const allowlist = await queryClient.fetchQuery(
        ['polygon-allowlist'],
        async () => {
          return (
            await rainbowFetch(
              'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
              { method: 'get' }
            )
          ).data.data.addresses;
        },
        {
          staleTime: POLYGON_ALLOWLIST_STALE_TIME, // 10 minutes
        }
      );
      setPolygonAllowlist(allowlist);
    };
    fetchPolygonAllowlist();
  }, [queryClient]);

  // Make the first query to retrieve the unique tokens.
  const uniqueTokensQuery = useQuery<UniqueAsset[]>(
    uniqueTokensQueryKey({ address }),
    async () => {
      if (!address) return [];

      const { storedTokens, hasStoredTokens } = await getStoredUniqueTokens({
        address,
        network,
      });

      let uniqueTokens = storedTokens;
      if (!hasStoredTokens) {
        const { rawNFTData, nextCursor } = await fetchRawUniqueTokens(
          address as string,
          START_CURSOR
        );
        setCursor(nextCursor);
        uniqueTokens = rawNFTData;
      }

      // If there are any "unknown" ENS names, fallback to the ENS
      // metadata service.
      // uniqueTokens = await applyENSMetadataFallbackToTokens(uniqueTokens);

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

  useEffect(() => {
    if (!address) return;

    async function fetchMore({
      network,
      cursor,
      uniqueTokens = [],
    }: {
      network: Network;
      cursor: any;
      uniqueTokens?: UniqueAsset[];
    }): Promise<UniqueAsset[]> {
      if (
        mounted.current &&
        uniqueTokens?.length < UNIQUE_TOKENS_LIMIT_TOTAL &&
        cursor
      ) {
        // let moreUniqueTokens = await apiGetAccountUniqueTokens(
        //   network,
        //   address as string,
        //   page
        // );
        const { rawNFTData, nextCursor } = await fetchRawUniqueTokens(
          address as string,
          cursor
        );
        let moreUniqueTokens = parseSimplehashNFTs(rawNFTData).filter(
          (nft: UniqueAsset) => {
            if (nft.collection.name === null) return false;

            // filter out spam
            if (nft.spamScore >= 85) return false;

            // filter gnosis NFTs that are not POAPs
            if (
              nft.network === Network.gnosis &&
              nft.asset_contract &&
              nft?.asset_contract?.address?.toLowerCase() !== POAP_ADDRESS
            )
              return false;

            if (
              nft.network === Network.polygon &&
              !polygonAllowlist.includes(
                nft.asset_contract?.address?.toLowerCase()
              )
            ) {
              return false;
            }

            return true;
          }
        );

        // If there are any "unknown" ENS names, fallback to the ENS
        // metadata service.
        // moreUniqueTokens = await applyENSMetadataFallbackToTokens(
        //   moreUniqueTokens
        // );

        if (!hasStoredTokens && moreUniqueTokens.length) {
          queryClient.setQueryData<UniqueAsset[]>(
            uniqueTokensQueryKey({ address }),
            tokens =>
              tokens
                ? uniqBy([...tokens, ...moreUniqueTokens], 'uniqueId')
                : moreUniqueTokens
          );
        }
        return fetchMore({
          network,
          cursor: nextCursor,
          uniqueTokens: [...uniqueTokens, ...moreUniqueTokens],
        });
      }
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
        // Fetch more Ethereum tokens until all have fetched
        let tokens = (
          await fetchMore({
            network,
            cursor,
            uniqueTokens: hasStoredTokens ? [] : uniqueTokens,
          })
        ).filter((token: any) => token.familyName !== 'POAP');

        // // Fetch poaps
        // const poaps = await fetchPoaps(address);
        // if (poaps) {
        //   tokens = [...tokens, ...poaps];
        // }

        // // Fetch Polygon tokens until all have fetched
        // const polygonTokens = await fetchMore({ network: Network.polygon });
        // tokens = [...tokens, ...polygonTokens];

        // Fetch recently registered ENS tokens (OpenSea doesn't recognize these for a while).
        // We will fetch tokens registered in the past 48 hours to be safe.
        // const ensTokens = await fetchEnsTokens({
        //   address,
        //   timeAgo: { hours: 48 },
        // });
        // if (ensTokens.length > 0) {
        //   tokens = uniqBy([...tokens, ...ensTokens], 'uniqueId');
        // }

        if (hasStoredTokens) {
          queryClient.setQueryData<UniqueAsset[]>(
            uniqueTokensQueryKey({ address }),
            tokens
          );
        }

        await saveUniqueTokens(tokens, address, network);
      })();
    }
  }, [
    address,
    shouldFetchMore,
    network,
    uniqueTokens,
    queryClient,
    hasStoredTokens,
    infinite,
    mounted,
    cursor,
    polygonAllowlist,
  ]);

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
