import { metadataClient } from '@/graphql';
import { KingOfTheHill, KingOfTheHillRankings } from '@/graphql/__generated__/metadata';
import { RainbowError, logger } from '@/logger';
import Routes from '@/navigation/routesNames';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';
import { useNavigationStore } from '../navigation/navigationStore';

type State = {
  kingOfTheHill?: KingOfTheHill;
  kingOfTheHillLeaderBoard?: KingOfTheHillRankings;
};

async function kingOfTheHillQueryFunction({ currency }: { currency: string }): Promise<State | null> {
  try {
    const { kingOfTheHill, kingOfTheHillLeaderBoard } = await metadataClient.kingOfTheHill({ currency });

    if (!kingOfTheHill || !kingOfTheHillLeaderBoard) {
      return {};
    }

    // TODO: type hack because the generic Token type is badly typed and requires some fields we don't have on this query
    return {
      kingOfTheHill: kingOfTheHill as KingOfTheHill,
      kingOfTheHillLeaderBoard: kingOfTheHillLeaderBoard as KingOfTheHillRankings,
    };
  } catch (e) {
    logger.error(new RainbowError('[kingOfTheHillQueryFunction]: King of the Hill failed', e), { currency });
    return {};
  }
}

type KingOfTheHillQueryParams = {
  currency: string;
};

export const useKingOfTheHillStore = createQueryStore<State | null, KingOfTheHillQueryParams>(
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
