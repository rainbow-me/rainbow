import { prefetchCandlestickData } from '@/features/charts/stores/candlestickStore';
import Routes, { Route } from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { deepFreeze } from '@/utils/deepFreeze';

type PrefetchRegistry = Readonly<{
  [key in Route]?: [undefined] extends [RootStackParamList[key]] ? () => void : (params: RootStackParamList[key]) => void;
}>;

/**
 * A registry of routes to prefetch functions to be called ahead of navigation.
 */
export const prefetchRegistry = deepFreeze<PrefetchRegistry>({
  [Routes.EXPANDED_ASSET_SHEET_V2]: ({ asset }) => {
    prefetchCandlestickData(asset);
  },
});
