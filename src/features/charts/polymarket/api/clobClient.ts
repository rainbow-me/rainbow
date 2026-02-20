import { POLYMARKET_CLOB_PROXY_URL } from '@/features/polymarket/constants';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { FIDELITY_MAP, type PolymarketInterval, type PricePoint } from '../types';

// ============ Constants ====================================================== //

const EMPTY_PRICE_POINTS: PricePoint[] = [];

// ============ Types ========================================================== //

type ClobEndpoint = 'prices-history';
type ClobPriceHistoryResponse = { history: PricePoint[] };
type IntervalParam = '1h' | '6h' | '1d' | '1w' | '1m' | 'max';

// ============ Fetch Functions ================================================ //

export async function fetchPriceHistory(
  abortController: AbortController | null | undefined,
  interval: PolymarketInterval,
  tokenId: string,
  fidelity?: number
): Promise<PricePoint[]> {
  const { data } = await rainbowFetch<ClobPriceHistoryResponse>(buildClobUrl('prices-history'), {
    abortController,
    params: {
      fidelity: String(fidelity ?? FIDELITY_MAP[interval]),
      interval: toIntervalParam(interval),
      market: tokenId,
    },
  });
  return data?.history ?? EMPTY_PRICE_POINTS;
}

export async function fetchPriceHistoryWithTimestamps(
  abortController: AbortController | null | undefined,
  endTs: number,
  startTs: number,
  tokenId: string,
  fidelity = 60
): Promise<PricePoint[]> {
  const { data } = await rainbowFetch<ClobPriceHistoryResponse>(buildClobUrl('prices-history'), {
    abortController,
    params: {
      endTs: String(endTs),
      fidelity: String(fidelity),
      market: tokenId,
      startTs: String(startTs),
    },
  });
  return data?.history ?? EMPTY_PRICE_POINTS;
}

// ============ Helpers ======================================================== //

function buildClobUrl(endpoint: ClobEndpoint): string {
  return `${POLYMARKET_CLOB_PROXY_URL}/${endpoint}`;
}

function toIntervalParam(interval: PolymarketInterval): IntervalParam {
  switch (interval) {
    case '1m':
      return '1m';
    case '1h':
    case '6h':
    case '1d':
    case '1w':
      return interval;
    case 'max':
    default:
      return 'max';
  }
}
