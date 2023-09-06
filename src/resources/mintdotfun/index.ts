import { analyticsV2 } from '@/analytics';
import { useCallback, useEffect, useMemo } from 'react';
import { MINT_DOT_FUN, useExperimentalFlag } from '@/config';
import { IS_PROD } from '@/env';
import { arcClient, arcDevClient } from '@/graphql';
import { GetMintableCollectionsQuery } from '@/graphql/__generated__/arc';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { atom, useRecoilState } from 'recoil';
import { MMKV } from 'react-native-mmkv';

const graphqlClient = IS_PROD ? arcClient : arcDevClient;
const mmkv = new MMKV();

const MINTABLE_COLLECTIONS_FILTER_MMKV_KEY = 'mintableCollectionsFilter';

export enum MintableCollectionsFilter {
  All = 'all',
  Paid = 'paid',
  Free = 'free',
}

const mintableCollectionsFilterAtom = atom<MintableCollectionsFilter>({
  default:
    (mmkv.getString(MINTABLE_COLLECTIONS_FILTER_MMKV_KEY) as
      | MintableCollectionsFilter
      | undefined) ?? MintableCollectionsFilter.All,
  key: MINTABLE_COLLECTIONS_FILTER_MMKV_KEY,
});

export function mintableCollectionsQueryKey({ address }: { address: string }) {
  return createQueryKey(
    'mintableCollections',
    { address },
    { persisterVersion: 1 }
  );
}

/**
 * Gets the label for a given `MintableCollectionsFilter`.
 */
export function getMintableCollectionsFilterLabel(
  filter: MintableCollectionsFilter
) {
  switch (filter) {
    case MintableCollectionsFilter.All:
      return 'All';
    case MintableCollectionsFilter.Paid:
      return 'Paid';
    case MintableCollectionsFilter.Free:
      return 'Free';
  }
}

/**
 * Hook that returns the current `MintableCollectionsFilter` and a function to set it.
 */
export function useMintableCollectionsFilter() {
  const [filterState, setFilterState] = useRecoilState(
    mintableCollectionsFilterAtom
  );

  const setFilter = useCallback(
    (filter: MintableCollectionsFilter) => {
      analyticsV2.track(analyticsV2.event.mintDotFunChangedFilter, { filter });
      setFilterState(filter);
      mmkv.set(MINTABLE_COLLECTIONS_FILTER_MMKV_KEY, filter);
    },
    [setFilterState]
  );

  return { filter: filterState, setFilter };
}

/**
 * Hook that returns the featured mintable collection.
 */
export function useFeaturedMintableCollection() {}

/**
 * Hook that returns the mintable collections for a given wallet address.
 */
export function useMintableCollections({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const mintDotFunEnabled = useExperimentalFlag(MINT_DOT_FUN);
  const { filter } = useMintableCollectionsFilter();
  const queryKey = mintableCollectionsQueryKey({
    address: walletAddress,
  });

  const query = useQuery<GetMintableCollectionsQuery>(
    queryKey,
    async () =>
      await graphqlClient.getMintableCollections({
        walletAddress,
        chain: 7777777, // zora
      }),
    {
      enabled: mintDotFunEnabled && !!walletAddress,
      staleTime: 300_000, // 5 minutes
      cacheTime: 1_800_000, // 30 minutes
      refetchInterval: 600_000, // 10 minutes
    }
  );

  const featuredCollection = query.data?.getMintableCollections?.collections[0];

  const freeMints = useMemo(
    () =>
      query.data?.getMintableCollections?.collections.filter(
        collection =>
          collection.mintStatus.price === '0' &&
          collection.contractAddress !== featuredCollection?.contractAddress
      ),
    [
      featuredCollection?.contractAddress,
      query.data?.getMintableCollections?.collections,
    ]
  );

  const paidMints = useMemo(
    () =>
      query.data?.getMintableCollections?.collections.filter(
        collection =>
          collection.mintStatus.price !== '0' &&
          collection.contractAddress !== featuredCollection?.contractAddress
      ),
    [
      featuredCollection?.contractAddress,
      query.data?.getMintableCollections?.collections,
    ]
  );

  const allMints = useMemo(
    () =>
      query.data?.getMintableCollections?.collections.filter(
        collection =>
          collection.contractAddress !== featuredCollection?.contractAddress
      ),
    [
      featuredCollection?.contractAddress,
      query.data?.getMintableCollections?.collections,
    ]
  );

  let filteredMints;
  switch (filter) {
    case MintableCollectionsFilter.Free:
      filteredMints = freeMints;
      break;
    case MintableCollectionsFilter.Paid:
      filteredMints = paidMints;
      break;
    case MintableCollectionsFilter.All:
    default:
      filteredMints = allMints;
      break;
  }

  useEffect(
    () =>
      analyticsV2.identify({
        numberOfMints: allMints?.length ?? 0,
        numberOfFreeMints: freeMints?.length ?? 0,
        numberOfPaidMints: paidMints?.length ?? 0,
      }),
    [allMints?.length, freeMints?.length, paidMints?.length]
  );

  return {
    ...query,
    data: {
      ...query.data,
      getMintableCollections: {
        ...query.data?.getMintableCollections,
        collections: filteredMints,
        featuredCollection,
      },
    },
  };
}
