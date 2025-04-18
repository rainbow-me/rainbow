import { RainbowError, logger } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { metadataClient } from '@/graphql';
import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';
import { KingOfHillResponse, TokenKing, TokenWindow } from '@/graphql/__generated__/metadata';

export type KingOfTheHillToken = TokenKing;
export type KingOfTheHillKing = TokenWindow;

async function kingOfTheHillQueryFunction({ currency }: { currency: string }): Promise<KingOfHillResponse | null> {
  try {
    const { kingOfTheHill } = await metadataClient.kingOfTheHill({ currency });
    if (!kingOfTheHill) {
      return null;
    }

    return kingOfTheHill;
  } catch (e) {
    logger.error(new RainbowError('[kingOfTheHillQueryFunction]: King of the Hill failed', e), { currency });
    return null;
  }
}

type KingOfTheHillQueryParams = {
  currency: string;
};

export const useKingOfTheHillStore = createQueryStore<KingOfHillResponse | null, KingOfTheHillQueryParams>(
  {
    fetcher: kingOfTheHillQueryFunction,
    cacheTime: time.hours(1),
    keepPreviousData: true,
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
    },
    staleTime: time.seconds(1),
    disableAutoRefetching: true,
  },

  { storageKey: 'kingOfTheHill' }
);
