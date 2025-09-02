import { CandleSnapshotRequest } from '@nktkas/hyperliquid/script/src/types/mod';
import { ChainId } from '@/state/backendNetworks/types';

// ============ Types ========================================================== //

export type HyperliquidSymbol = string;
export type Token = { address: string; chainId: ChainId } | HyperliquidSymbol;

// ============ Enums ========================================================== //

export enum ChartType {
  Candlestick = 'candlestick',
  Line = 'line',
}

export enum CandleResolution {
  M1 = 'RESOLUTION_1_MIN',
  M5 = 'RESOLUTION_5_MIN',
  M15 = 'RESOLUTION_15_MIN',
  H1 = 'RESOLUTION_60_MIN',
  H4 = 'RESOLUTION_4_HR',
  H12 = 'RESOLUTION_12_HR',
  D1 = 'RESOLUTION_1_DAY',
  D7 = 'RESOLUTION_7_DAY',
}

export enum LineChartTimePeriod {
  H1 = '1H',
  D1 = '1D',
  W1 = '1W',
  M1 = '1M',
  Y1 = '1Y',
}

export enum LineChartTimespan {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year',
}

// ============ Hyperliquid ==================================================== //

export type HyperliquidInterval = CandleSnapshotRequest['req']['interval'];
