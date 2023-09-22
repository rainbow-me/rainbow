import { analyticsV2 } from '@/analytics';
import { useCallback, useEffect, useMemo } from 'react';
import { MINTS, useExperimentalFlag } from '@/config';
import { IS_PROD, IS_TEST } from '@/env';
import { arcClient, arcDevClient } from '@/graphql';
import { GetMintableCollectionsQuery } from '@/graphql/__generated__/arc';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { atom, useRecoilState } from 'recoil';
import { MMKV } from 'react-native-mmkv';
import * as i18n from '@/languages';
import config from '@/model/config';

const graphqlClient = IS_PROD ? arcClient : arcDevClient;
const mmkv = new MMKV();

const MINTS_FILTER_MMKV_KEY = 'mintsFilter';

export enum MintsFilter {
  All = 'all',
  Paid = 'paid',
  Free = 'free',
}

const mintsFilterAtom = atom<MintsFilter>({
  default:
    (mmkv.getString(MINTS_FILTER_MMKV_KEY) as MintsFilter | undefined) ??
    MintsFilter.All,
  key: MINTS_FILTER_MMKV_KEY,
});

export function mintsQueryKey({ address }: { address: string }) {
  return createQueryKey('mints', { address }, { persisterVersion: 1 });
}

/**
 * Gets the label for a given `MintsFilter`.
 */
export function getMintsFilterLabel(filter: MintsFilter) {
  switch (filter) {
    case MintsFilter.All:
      return i18n.t(i18n.l.mints.filter.all);
    case MintsFilter.Paid:
      return i18n.t(i18n.l.mints.filter.paid);
    case MintsFilter.Free:
      return i18n.t(i18n.l.mints.filter.free);
  }
}

/**
 * Hook that returns the current `MintsFilter` and a function to set it.
 */
export function useMintsFilter() {
  const [filterState, setFilterState] = useRecoilState(mintsFilterAtom);

  const setFilter = useCallback(
    (filter: MintsFilter) => {
      analyticsV2.track(analyticsV2.event.mintsChangedFilter, { filter });
      setFilterState(filter);
      mmkv.set(MINTS_FILTER_MMKV_KEY, filter);
    },
    [setFilterState]
  );

  return { filter: filterState, setFilter };
}

/**
 * Hook that returns the mintable collections for a given wallet address.
 */
export function useMints({ walletAddress }: { walletAddress: string }) {
  const mintsEnabled =
    (useExperimentalFlag(MINTS) || config.mints_enabled) && !IS_TEST;
  const { filter } = useMintsFilter();
  const queryKey = mintsQueryKey({
    address: walletAddress,
  });

  const query = useQuery<GetMintableCollectionsQuery>(
    queryKey,
    async () =>
      await graphqlClient.getMintableCollections({
        walletAddress,
      }),
    {
      enabled: mintsEnabled && !!walletAddress,
      staleTime: 300_000, // 5 minutes
      cacheTime: 1_800_000, // 30 minutes
      refetchInterval: 600_000, // 10 minutes
    }
  );

  const featuredMint = query.data?.getMintableCollections?.collections?.find(
    c => c.imageURL
  );

  const freeMints = useMemo(
    () =>
      query.data?.getMintableCollections?.collections.filter(
        collection => collection.mintStatus.price === '0'
      ),
    [query.data?.getMintableCollections?.collections]
  );

  const paidMints = useMemo(
    () =>
      query.data?.getMintableCollections?.collections.filter(
        collection => collection.mintStatus.price !== '0'
      ),
    [query.data?.getMintableCollections?.collections]
  );

  const allMints = useMemo(
    () => query.data?.getMintableCollections?.collections,
    [query.data?.getMintableCollections?.collections]
  );

  let filteredMints;
  switch (filter) {
    case MintsFilter.Free:
      filteredMints = freeMints;
      break;
    case MintsFilter.Paid:
      filteredMints = paidMints;
      break;
    case MintsFilter.All:
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
      mints: filteredMints,
      featuredMint,
    },
  };
}
