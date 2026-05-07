import {
  useHyperliquidSparklineStore,
  type HyperliquidSparklineFetchData,
  type PerpSparklineData,
} from '@/features/perps/stores/hyperliquidSparklineStore';
import {
  useDiscoverPerpsPlacement,
  type DiscoverPerpMarketItem,
} from '@/features/placements/stores/discover/discoverPerpsPlacementStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';

type DiscoverPerpsRequest = {
  enabled: boolean;
  symbolsKey: string;
};

type DiscoverPerpsState = {
  chartsBySymbol: Record<string, PerpSparklineData>;
  getChart: (symbol: string) => PerpSparklineData | undefined;
};

type Params = { symbolsKey: string };

const useDiscoverPerpsRequestStore = createDerivedStore<DiscoverPerpsRequest>(
  $ => {
    const items = $(useDiscoverPerpsPlacement, state => state.items);
    const symbols = readPerpSymbols(items);

    return {
      enabled: symbols.length > 0,
      symbolsKey: symbols.join(','),
    };
  },
  { equalityFn: shallowEqual }
);

export const useDiscoverPerpsStore = createQueryStore<HyperliquidSparklineFetchData, Params, DiscoverPerpsState>(
  {
    fetcher: fetchDiscoverPerps,
    enabled: $ => $(useDiscoverPerpsRequestStore, state => state.enabled),
    params: {
      symbolsKey: $ => $(useDiscoverPerpsRequestStore, state => state.symbolsKey),
    },
    setData: ({ data, set }) => set({ chartsBySymbol: data.chartsBySymbol }),
    staleTime: time.minutes(5),
    cacheTime: time.minutes(10),
  },
  (_set, get) => ({
    chartsBySymbol: {},
    getChart: (symbol: string) => get().chartsBySymbol[symbol],
  })
);

async function fetchDiscoverPerps(params: Params): Promise<HyperliquidSparklineFetchData> {
  return (await useHyperliquidSparklineStore.getState().fetch(params)) ?? { chartsBySymbol: {} };
}

function readPerpSymbols(items: readonly DiscoverPerpMarketItem[]): string[] {
  return Array.from(new Set(items.map(item => item.market.symbol))).sort();
}
