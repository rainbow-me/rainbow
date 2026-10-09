import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { type PolymarketEvent, type PolymarketMarket, type SportsMarketType } from '@/features/polymarket/types/polymarket-event';
import { BET_TYPE, getBetType, isThreeWayMoneyline, type BetType } from '@/features/polymarket/utils/marketClassification';

/** Moneyline markets displayed together, including three-way outcomes. */
export type MoneylineGroup = MarketGroup & {
  markets: PolymarketMarket[];
  isThreeWay: boolean;
};

/** Markets of one type, selectable by their line. */
export type LineBasedGroup = MarketGroup & {
  markets: PolymarketMarket[];
  mainLine: number;
};

/** A market displayed in its own section. */
export type SingleMarketGroup = MarketGroup & {
  market: PolymarketMarket;
};

type MarketGroup = {
  id: string;
  label: string;
  icon?: string;
};

const SUPPORTED_SPORTS_MARKET_TYPES = new Set(Object.values(POLYMARKET_SPORTS_MARKET_TYPE));

const SPORTS_MARKET_TYPE_LABELS: Partial<Record<SportsMarketType, { title: string; icon: string }>> = {
  [POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE]: { title: 'Winner', icon: '􁙌' },
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_MONEYLINE]: { title: 'First Half', icon: '½' },
  [POLYMARKET_SPORTS_MARKET_TYPE.SPREADS]: { title: 'Spreads: Full Match', icon: '􁙌' },
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS]: { title: 'Spreads: First Half', icon: '½' },
  [POLYMARKET_SPORTS_MARKET_TYPE.TOTALS]: { title: 'Totals: Full Match', icon: '􁙌' },
  [POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_TOTALS]: { title: 'Totals: First Half', icon: '½' },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_MATCH_TOTALS]: { title: 'Total Games', icon: '' },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_SET_HANDICAP]: { title: 'Set Handicap', icon: '' },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_SET_TOTALS]: { title: 'Total Sets', icon: '' },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_FIRST_SET_WINNER]: { title: '1st Set Winner', icon: '􁙌' },
  [POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_FIRST_SET_TOTALS]: { title: '1st Set Total Games', icon: '' },
};

const SPORTS_MARKET_TYPE_ORDER = new Map<SportsMarketType, number>(
  [
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
  ].map((type, index) => [type, index])
);

/**
 * Groups supported Sports markets and lists available bet types in display order.
 */
export function getMarketsGroupedByBetType(
  markets: readonly PolymarketMarket[],
  mainLines: Pick<PolymarketEvent, 'spreadsMainLine' | 'totalsMainLine'>
): {
  moneyline: MoneylineGroup[];
  spreads: LineBasedGroup[];
  totals: LineBasedGroup[];
  other: SingleMarketGroup[];
  betTypes: BetType[];
} {
  const marketsByType = new Map<SportsMarketType, [PolymarketMarket, ...PolymarketMarket[]]>();

  for (const market of markets) {
    if (!SUPPORTED_SPORTS_MARKET_TYPES.has(market.sportsMarketType)) continue;
    const groupMarkets = marketsByType.get(market.sportsMarketType);
    if (groupMarkets) groupMarkets.push(market);
    else marketsByType.set(market.sportsMarketType, [market]);
  }

  const orderedGroups = Array.from(marketsByType.values()).sort(
    (a, b) => (SPORTS_MARKET_TYPE_ORDER.get(a[0].sportsMarketType) ?? -1) - (SPORTS_MARKET_TYPE_ORDER.get(b[0].sportsMarketType) ?? -1)
  );

  const moneyline: MoneylineGroup[] = [];
  const spreads: LineBasedGroup[] = [];
  const totals: LineBasedGroup[] = [];
  const other: SingleMarketGroup[] = [];
  const betTypes: BetType[] = [];

  for (const groupMarkets of orderedGroups) {
    const sportsMarketType = groupMarkets[0].sportsMarketType;
    const betType = getBetType(sportsMarketType);

    if (betType === BET_TYPE.OTHER) {
      for (const market of groupMarkets) {
        other.push({
          id: market.id,
          label: market.groupItemTitle || market.question,
          market,
        });
      }
      continue;
    }

    const labels = SPORTS_MARKET_TYPE_LABELS[sportsMarketType];

    if (betType === BET_TYPE.MONEYLINE) {
      moneyline.push({
        id: sportsMarketType,
        label: labels?.title ?? sportsMarketType,
        icon: labels?.icon,
        markets: groupMarkets,
        isThreeWay: isThreeWayMoneyline(groupMarkets),
      });
      continue;
    }

    groupMarkets.sort((a, b) => Math.abs(a.line) - Math.abs(b.line));

    let mainLine: number;
    if (sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.SPREADS && mainLines.spreadsMainLine != null) {
      mainLine = mainLines.spreadsMainLine;
    } else if (sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.TOTALS && mainLines.totalsMainLine != null) {
      mainLine = mainLines.totalsMainLine;
    } else {
      mainLine = groupMarkets[0].line ?? 0;
    }

    (betType === BET_TYPE.SPREADS ? spreads : totals).push({
      id: sportsMarketType,
      label: labels?.title ?? sportsMarketType,
      icon: labels?.icon,
      markets: groupMarkets,
      mainLine,
    });
  }

  if (moneyline.length) betTypes.push(BET_TYPE.MONEYLINE);
  if (spreads.length) betTypes.push(BET_TYPE.SPREADS);
  if (totals.length) betTypes.push(BET_TYPE.TOTALS);
  if (other.length) betTypes.push(BET_TYPE.OTHER);

  return { moneyline, spreads, totals, other, betTypes };
}
