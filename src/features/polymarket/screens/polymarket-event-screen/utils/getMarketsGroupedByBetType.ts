import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { PolymarketEvent, PolymarketMarket, SportsMarketType } from '@/features/polymarket/types/polymarket-event';

export const BET_TYPE = {
  MONEYLINE: 'moneyline',
  SPREADS: 'spreads',
  TOTALS: 'totals',
} as const;

export type BetType = (typeof BET_TYPE)[keyof typeof BET_TYPE];

const SPORTS_MARKET_TYPE_LABELS: Partial<Record<SportsMarketType, string>> = {
  [POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE]: 'Winner',
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_MONEYLINE]: 'First Half',
  [POLYMARKET_SPORTS_MARKET_TYPE.CHILD_MONEYLINE]: 'Other',
  [POLYMARKET_SPORTS_MARKET_TYPE.BOTH_TEAMS_TO_SCORE]: 'Both Teams to Score',
  [POLYMARKET_SPORTS_MARKET_TYPE.SPREADS]: 'Full Match',
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS]: 'First Half',
  [POLYMARKET_SPORTS_MARKET_TYPE.TOTALS]: 'Full Match',
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_TOTALS]: 'First Half',
  [POLYMARKET_SPORTS_MARKET_TYPE.TEAM_TOTALS]: 'Team Totals',
};

export type MoneylineGroup = {
  sportsMarketType: SportsMarketType;
  label: string;
  markets: PolymarketMarket[];
};

export type LineBasedGroup = {
  sportsMarketType: SportsMarketType;
  label: string;
  lines: {
    value: number;
    market: PolymarketMarket;
  }[];
  mainLine: number;
};

export type GroupedSportsMarkets = {
  moneyline: MoneylineGroup[];
  spreads: LineBasedGroup[];
  totals: LineBasedGroup[];
};

const sportsMarketTypeOrder: SportsMarketType[] = [
  POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE,
  POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_MONEYLINE,
  POLYMARKET_SPORTS_MARKET_TYPE.CHILD_MONEYLINE,
  POLYMARKET_SPORTS_MARKET_TYPE.BOTH_TEAMS_TO_SCORE,
  POLYMARKET_SPORTS_MARKET_TYPE.SPREADS,
  POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS,
  POLYMARKET_SPORTS_MARKET_TYPE.TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.TEAM_TOTALS,
];

export function getMarketsGroupedByBetType(event: PolymarketEvent): GroupedSportsMarkets {
  const { markets } = event;

  const moneylineByType = new Map<SportsMarketType, PolymarketMarket[]>();
  const spreadsByType = new Map<SportsMarketType, PolymarketMarket[]>();
  const totalsByType = new Map<SportsMarketType, PolymarketMarket[]>();

  for (const market of markets) {
    const betType = getBetType(market.sportsMarketType);
    const targetMap = betType === BET_TYPE.MONEYLINE ? moneylineByType : betType === BET_TYPE.SPREADS ? spreadsByType : totalsByType;

    const existing = targetMap.get(market.sportsMarketType) ?? [];
    targetMap.set(market.sportsMarketType, [...existing, market]);
  }

  return {
    moneyline: buildMoneylineGroups(moneylineByType),
    spreads: buildLineBasedGroups(spreadsByType, event),
    totals: buildLineBasedGroups(totalsByType, event),
  };
}

// TODO: Does this categorization for both teams to score make sense?
function getBetType(sportsMarketType: SportsMarketType): BetType {
  switch (sportsMarketType) {
    case POLYMARKET_SPORTS_MARKET_TYPE.SPREADS:
    case POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS:
      return BET_TYPE.SPREADS;

    case POLYMARKET_SPORTS_MARKET_TYPE.TOTALS:
    case POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_TOTALS:
    case POLYMARKET_SPORTS_MARKET_TYPE.TEAM_TOTALS:
      return BET_TYPE.TOTALS;

    case POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE:
    case POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_MONEYLINE:
    case POLYMARKET_SPORTS_MARKET_TYPE.CHILD_MONEYLINE:
    case POLYMARKET_SPORTS_MARKET_TYPE.BOTH_TEAMS_TO_SCORE:
      return BET_TYPE.MONEYLINE;

    default:
      return BET_TYPE.MONEYLINE;
  }
}

function buildLineBasedGroups(map: Map<SportsMarketType, PolymarketMarket[]>, event: PolymarketEvent): LineBasedGroup[] {
  return Array.from(map.entries())
    .sort(([a], [b]) => sportsMarketTypeOrder.indexOf(a) - sportsMarketTypeOrder.indexOf(b))
    .map(([sportsMarketType, groupMarkets]) => {
      const sortedMarkets = groupMarkets.sort((a, b) => Math.abs(a.line) - Math.abs(b.line));

      // Determine main line for this specific market type
      let mainLine: number;
      if (sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.SPREADS && event.spreadsMainLine != null) {
        mainLine = event.spreadsMainLine;
      } else if (sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.TOTALS && event.totalsMainLine != null) {
        mainLine = event.totalsMainLine;
      } else {
        // For other market types (first half, team totals, etc.), use the first available line
        mainLine = sortedMarkets[0]?.line ?? 0;
      }

      return {
        sportsMarketType,
        label: SPORTS_MARKET_TYPE_LABELS[sportsMarketType] ?? sportsMarketType,
        lines: sortedMarkets.map(market => ({
          value: market.line,
          market,
        })),
        mainLine,
      };
    });
}

function buildMoneylineGroups(map: Map<SportsMarketType, PolymarketMarket[]>): MoneylineGroup[] {
  return Array.from(map.entries())
    .sort(([a], [b]) => sportsMarketTypeOrder.indexOf(a) - sportsMarketTypeOrder.indexOf(b))
    .map(([sportsMarketType, groupMarkets]) => ({
      sportsMarketType,
      label: SPORTS_MARKET_TYPE_LABELS[sportsMarketType] ?? sportsMarketType,
      markets: groupMarkets,
    }));
}
