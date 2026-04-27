import { type BaseStore } from '@storesjs/stores';

import { type LineChartDataStore } from '@/features/charts/line/compact/types';
import { type TokenData } from '@/state/liveTokens/types';

export type MarketDisplayItem = {
  id: string;
  accentColor: string;
  chartColor: string;
  chartId: string;
  chartStore: BaseStore<LineChartDataStore>;
  displayName: string;
  iconUrl: string | undefined;
  initialPrice: string;
  initialPriceLastUpdated?: number;
  initialPriceChange: string;
  leverage: number | undefined;
  liveTokenId: string;
  priceChangeSelector: (token: TokenData) => string;
  priceSelector: (token: TokenData) => string;
};
