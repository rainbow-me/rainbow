import { RainbowError, logger } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { metadataClient } from '@/graphql';
import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';
import { TokenKing } from '@/graphql/__generated__/metadata';

export type KingOfTheHillToken = TokenKing & {
  price: {
    relativeChange24h: number;
    value: number;
  };
  market: {
    volume: {
      h24: number;
    };
    marketCap: number;
  };
};

type Window = {
  start: number;
  end: number;
};

export type KingOfTheHillKing = {
  token: KingOfTheHillToken;
  window: Window;
};

type KingOfTheHillData = {
  currentKing: KingOfTheHillKing;
  lastWinner: KingOfTheHillKing;
};

async function kingOfTheHillQueryFunction({ currency }: { currency: string }): Promise<KingOfTheHillData | null> {
  try {
    const { kingOfTheHill } = await metadataClient.kingOfTheHill({ currency });
    if (!kingOfTheHill) {
      return null;
    }

    const { currentKing, lastWinner } = kingOfTheHill;

    return {
      currentKing: {
        window: currentKing.window,
        token: {
          ...currentKing.token,
          price: currentKing.price,
          market: currentKing.market,
        },
      },
      lastWinner: {
        window: lastWinner.window,
        token: {
          ...lastWinner.token,
          price: lastWinner.price,
          market: lastWinner.market,
        },
      },
    };
  } catch (e) {
    logger.error(new RainbowError('[kingOfTheHillQueryFunction]: King of the Hill failed', e), { currency });
    return null;
  }
}

type KingOfTheHillQueryParams = {
  currency: string;
};

export const useKingOfTheHillStore = createQueryStore<KingOfTheHillData | null, KingOfTheHillQueryParams>(
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
