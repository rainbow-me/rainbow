import { RainbowError, logger } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { metadataClient } from '@/graphql';
import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';
import { useNavigationStore } from '../navigation/navigationStore';
import Routes from '@/navigation/routesNames';
import { KingOfTheHill } from '@/graphql/__generated__/metadata';

async function kingOfTheHillQueryFunction({ currency }: { currency: string }): Promise<KingOfTheHill | null> {
  try {
    const { kingOfTheHill } = await metadataClient.kingOfTheHill({ currency });
    if (!kingOfTheHill) return null;

    // TODO: This is a hack because the generic Token type is badly typed and requires some fields we don't have on this query
    return kingOfTheHill as KingOfTheHill;
  } catch (e) {
    logger.error(new RainbowError('[kingOfTheHillQueryFunction]: King of the Hill failed', e), { currency });
    return null;
  }
}

type KingOfTheHillQueryParams = {
  currency: string;
};

export const useKingOfTheHillStore = createQueryStore<KingOfTheHill | null, KingOfTheHillQueryParams>(
  {
    fetcher: kingOfTheHillQueryFunction,
    onFetched: ({ set }) => {
      // if not on discover screen, disable query store to prevent re-fetching
      const activeSwipeRoute = useNavigationStore.getState().activeSwipeRoute;
      if (activeSwipeRoute !== Routes.DISCOVER_SCREEN) {
        set({ enabled: false });
      }
    },
    cacheTime: time.hours(1),
    keepPreviousData: false,
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
    },
    staleTime: time.seconds(5),
  },

  { storageKey: 'kingOfTheHill', version: 1 }
);
