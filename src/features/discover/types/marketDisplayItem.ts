import { type LineChartDataStore } from '@/features/charts/line/compact/types';
import { type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import { type BaseRainbowStore } from '@/state/internal/types';
import { type TokenData } from '@/state/liveTokens/types';

export type MarketDisplayItem = {
  id: string;
  accentColor: string;
  chartColor: string;
  chartId: string;
  chartStore: BaseRainbowStore<LineChartDataStore>;
  displayName: string;
  iconUrl: string | undefined;
  initialPrice: string;
  initialPriceLastUpdated?: number;
  initialPriceChange: string;
  leverage: number | undefined;
  liveTokenId: string;
  onNavigate: () => void;
  pressMetadata: PlacementItemAnalyticsMetadata;
  priceChangeSelector: (token: TokenData) => string;
  priceSelector: (token: TokenData) => string;
};
