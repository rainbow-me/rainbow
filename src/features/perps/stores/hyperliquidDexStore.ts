import { DEFAULT_PERP_DEX_IDS } from '@/features/perps/constants';
import { HyperliquidDex } from '@/features/perps/types';
import { logger, ensureError, RainbowError } from '@/logger';
import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

type HyperliquidDexStoreData = {
  dexes: HyperliquidDex[];
};

type HyperliquidDexStore = HyperliquidDexStoreData & {
  getDexIds: () => string[];
  getDex: (dexId: string) => HyperliquidDex | undefined;
  hasDex: (dexId: string) => boolean;
};

const DEFAULT_DEXES: HyperliquidDex[] = DEFAULT_PERP_DEX_IDS.map(name => ({ name }));

export const useHyperliquidDexStore = createQueryStore<HyperliquidDexStoreData, never, HyperliquidDexStore>(
  {
    fetcher: fetchHyperliquidDexes,
    setData: ({ data, set }) => set({ dexes: data.dexes }),
    cacheTime: time.seconds(1),
    staleTime: time.seconds(30),
  },

  (_, get) => ({
    dexes: DEFAULT_DEXES,
    getDexIds: () => get().dexes.map(dex => dex.name),
    getDex: dexId => get().dexes.find(dex => dex.name === dexId),
    hasDex: dexId => get().getDexIds().includes(dexId),
  }),

  {
    partialize: state => ({
      dexes: state.dexes,
    }),
    storageKey: 'hyperliquidDexStore',
    version: 1,
  }
);

export const hyperliquidDexActions = createStoreActions(useHyperliquidDexStore);

async function fetchHyperliquidDexes(): Promise<HyperliquidDexStoreData> {
  try {
    const response = await infoClient.perpDexs();
    const dexes = response.filter(Boolean);

    console.log('dexes', dexes);

    return {
      dexes: mergeWithDefaults(dexes),
    };
  } catch (error) {
    logger.error(new RainbowError('[HyperliquidDexStore] Failed to fetch perp dex list', ensureError(error)));
    return {
      dexes: DEFAULT_DEXES,
    };
  }
}

function mergeWithDefaults(dexes: HyperliquidDex[]): HyperliquidDex[] {
  const merged = [...dexes];

  DEFAULT_DEXES.forEach(defaultDex => {
    const hasDex = merged.some(dex => dex.name === defaultDex.name);
    if (!hasDex) merged.unshift(defaultDex);
  });

  return merged.length ? merged : DEFAULT_DEXES;
}
