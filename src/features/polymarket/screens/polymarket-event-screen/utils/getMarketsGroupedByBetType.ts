import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { type PolymarketEvent, type PolymarketMarket, type SportsMarketType } from '@/features/polymarket/types/polymarket-event';
import { getBetType, isThreeWayMoneyline, type BetType } from '@/features/polymarket/utils/marketClassification';

const SUPPORTED_SPORTS_MARKET_TYPES = new Set(Object.values(POLYMARKET_SPORTS_MARKET_TYPE));

const SPORTS_MARKET_TYPE_LABELS: Partial<
  Record<
    SportsMarketType,
    {
      title: string;
      icon: string;
    }
  >
> = {
  [POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE]: {
    title: 'Winner',
    icon: '􁙌',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_MONEYLINE]: {
    title: 'First Half',
    icon: '½',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.BOTH_TEAMS_TO_SCORE]: {
    title: 'Both Teams to Score',
    icon: '',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.SPREADS]: {
    title: 'Spreads: Full Match',
    icon: '􁙌',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS]: {
    title: 'Spreads: First Half',
    icon: '½',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.TOTALS]: {
    title: 'Totals: Full Match',
    icon: '􁙌',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_TOTALS]: {
    title: 'Totals: First Half',
    icon: '½',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_MATCH_TOTALS]: {
    title: 'Total Games',
    icon: '',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_SET_HANDICAP]: {
    title: 'Set Handicap',
    icon: '',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_SET_TOTALS]: {
    title: 'Total Sets',
    icon: '',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_FIRST_SET_WINNER]: {
    title: '1st Set Winner',
    icon: '􁙌',
  },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_FIRST_SET_TOTALS]: {
    title: '1st Set Total Games',
    icon: '',
  },
};

export type MoneylineGroup = {
  id: string;
  sportsMarketType: SportsMarketType;
  label: string;
  icon?: string;
  isThreeWay?: boolean;
  markets: PolymarketMarket[];
};

export type LineBasedGroup = {
  id: string;
  sportsMarketType: SportsMarketType;
  label: string;
  icon?: string;
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
  other: MoneylineGroup[];
};

const SPORTS_MARKET_TYPE_ORDER: SportsMarketType[] = [
  POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_FIRST_SET_WINNER,
  POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_MONEYLINE,
  POLYMARKET_SPORTS_MARKET_TYPE.CHILD_MONEYLINE,
  POLYMARKET_SPORTS_MARKET_TYPE.BOTH_TEAMS_TO_SCORE,
  POLYMARKET_SPORTS_MARKET_TYPE.SPREADS,
  POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS,
  POLYMARKET_SPORTS_MARKET_TYPE.TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_MATCH_TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_SET_HANDICAP,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_SET_TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_FIRST_SET_TOTALS,
];

export function getMarketsGroupedByBetType(event: PolymarketEvent): GroupedSportsMarkets {
  const groups: Record<BetType, Map<SportsMarketType, PolymarketMarket[]>> = {
    moneyline: new Map(),
    spreads: new Map(),
    totals: new Map(),
    other: new Map(),
  };

  for (const market of event.markets) {
    if (!SUPPORTED_SPORTS_MARKET_TYPES.has(market.sportsMarketType)) continue;

    const group = groups[getBetType(market.sportsMarketType)];
    const markets = group.get(market.sportsMarketType);
    if (markets) markets.push(market);
    else group.set(market.sportsMarketType, [market]);
  }

  return {
    moneyline: buildMoneylineGroups(groups.moneyline),
    spreads: buildLineBasedGroups(groups.spreads, event),
    totals: buildLineBasedGroups(groups.totals, event),
    other: buildOtherGroups(groups.other),
  };
}

function buildLineBasedGroups(map: Map<SportsMarketType, PolymarketMarket[]>, event: PolymarketEvent): LineBasedGroup[] {
  return Array.from(map.entries())
    .sort(([a], [b]) => SPORTS_MARKET_TYPE_ORDER.indexOf(a) - SPORTS_MARKET_TYPE_ORDER.indexOf(b))
    .map(([sportsMarketType, groupMarkets]) => {
      const sortedMarkets = groupMarkets.sort((a, b) => Math.abs(a.line) - Math.abs(b.line));

      let mainLine: number;
      if (sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.SPREADS && event.spreadsMainLine != null) {
        mainLine = event.spreadsMainLine;
      } else if (sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.TOTALS && event.totalsMainLine != null) {
        mainLine = event.totalsMainLine;
      } else {
        mainLine = sortedMarkets[0]?.line ?? 0;
      }

      const labels = SPORTS_MARKET_TYPE_LABELS[sportsMarketType];
      return {
        id: sportsMarketType,
        sportsMarketType,
        label: labels?.title ?? sportsMarketType,
        icon: labels?.icon,
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
    .sort(([a], [b]) => SPORTS_MARKET_TYPE_ORDER.indexOf(a) - SPORTS_MARKET_TYPE_ORDER.indexOf(b))
    .map(([sportsMarketType, groupMarkets]) => {
      const labels = SPORTS_MARKET_TYPE_LABELS[sportsMarketType];

      return {
        id: sportsMarketType,
        sportsMarketType,
        label: labels?.title ?? sportsMarketType,
        icon: labels?.icon,
        isThreeWay: isThreeWayMoneyline(groupMarkets),
        markets: groupMarkets,
      };
    });
}

function buildOtherGroups(map: Map<SportsMarketType, PolymarketMarket[]>): MoneylineGroup[] {
  return Array.from(map.entries())
    .sort(([a], [b]) => SPORTS_MARKET_TYPE_ORDER.indexOf(a) - SPORTS_MARKET_TYPE_ORDER.indexOf(b))
    .flatMap(([sportsMarketType, markets]) =>
      markets.map(market => ({
        id: market.id,
        sportsMarketType,
        label: market.groupItemTitle || market.question,
        icon: '',
        markets: [market],
      }))
    );
}
