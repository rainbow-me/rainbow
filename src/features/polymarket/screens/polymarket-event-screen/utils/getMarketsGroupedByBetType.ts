import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { PolymarketEvent, PolymarketMarket, SportsMarketType } from '@/features/polymarket/types/polymarket-event';
import { BET_TYPE, getBetType, isThreeWayMoneyline } from '@/features/polymarket/utils/marketClassification';

export { BET_TYPE, type BetType } from '@/features/polymarket/utils/marketClassification';

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

const sportsMarketTypeOrder: SportsMarketType[] = [
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
  const { markets: rawMarkets } = event;

  const markets = filterUnsupportedMarkets(rawMarkets);

  const moneylineByType = new Map<SportsMarketType, PolymarketMarket[]>();
  const spreadsByType = new Map<SportsMarketType, PolymarketMarket[]>();
  const totalsByType = new Map<SportsMarketType, PolymarketMarket[]>();
  const otherByType = new Map<SportsMarketType, PolymarketMarket[]>();

  for (const market of markets) {
    const betType = getBetType(market.sportsMarketType);
    let targetMap;
    switch (betType) {
      case BET_TYPE.MONEYLINE:
        targetMap = moneylineByType;
        break;
      case BET_TYPE.SPREADS:
        targetMap = spreadsByType;
        break;
      case BET_TYPE.TOTALS:
        targetMap = totalsByType;
        break;
      default:
        targetMap = otherByType;
        break;
    }

    const existing = targetMap.get(market.sportsMarketType) ?? [];
    targetMap.set(market.sportsMarketType, [...existing, market]);
  }

  return {
    moneyline: buildMoneylineGroups(moneylineByType),
    spreads: buildLineBasedGroups(spreadsByType, event),
    totals: buildLineBasedGroups(totalsByType, event),
    other: buildOtherGroups(otherByType),
  };
}


function getSportsMarketTypeLabels(sportsMarketType: SportsMarketType) {
  return {
    label: SPORTS_MARKET_TYPE_LABELS[sportsMarketType]?.title ?? sportsMarketType,
    icon: SPORTS_MARKET_TYPE_LABELS[sportsMarketType]?.icon,
  };
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

      const labels = getSportsMarketTypeLabels(sportsMarketType);
      return {
        id: sportsMarketType,
        sportsMarketType,
        label: labels.label,
        icon: labels.icon,
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
    .map(([sportsMarketType, groupMarkets]) => {
      const labels = getSportsMarketTypeLabels(sportsMarketType);

      return {
        id: sportsMarketType,
        sportsMarketType,
        label: labels.label,
        icon: labels.icon,
        isThreeWay: isThreeWayMoneyline(groupMarkets),
        markets: groupMarkets,
      };
    });
}

function buildOtherGroups(map: Map<SportsMarketType, PolymarketMarket[]>): MoneylineGroup[] {
  return Array.from(map.entries())
    .sort(([a], [b]) => sportsMarketTypeOrder.indexOf(a) - sportsMarketTypeOrder.indexOf(b))
    .map(([sportsMarketType, groupMarkets]) => {
      return groupMarkets.map(market => {
        const labels = {
          label: market.groupItemTitle || market.question,
          icon: '',
        };
        return {
          id: market.id,
          sportsMarketType,
          label: labels.label,
          icon: labels.icon,
          markets: [market],
        };
      });
    })
    .flat();
}

function filterUnsupportedMarkets(markets: PolymarketMarket[]): PolymarketMarket[] {
  return markets.filter(market => SUPPORTED_SPORTS_MARKET_TYPES.has(market.sportsMarketType));
}
