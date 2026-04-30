import {
  useHyperliquidSparklineStore,
  type HyperliquidSparklineFetchData,
  type PerpSparklineData,
} from '@/features/perps/stores/hyperliquidSparklineStore';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPlacementAvailability } from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
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
    const { perps } = $(useDiscoverPlacementAvailability);
    const symbols = perps ? $(usePlacementsStore, state => readPerpSymbols(state.getPlacement(PLACEMENT_IDS.PERPS))) : [];

    return {
      enabled: perps && symbols.length > 0,
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

function readPerpSymbols(placement: Placement | undefined): string[] {
  if (!placement) return [];
  return Array.from(
    new Set(placement.items.filter(item => item.ref.source === 'hyperliquid' && item.ref.id).map(item => item.ref.id))
  ).sort();
}
