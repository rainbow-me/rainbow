import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';

export const BET_TYPE = {
  MONEYLINE: 'moneyline',
  SPREADS: 'spreads',
  TOTALS: 'totals',
  OTHER: 'other',
} as const;

export type BetType = (typeof BET_TYPE)[keyof typeof BET_TYPE];

const MONEYLINE_TYPES = new Set<string>([
  POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE,
  POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_MONEYLINE,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_FIRST_SET_WINNER,
]);

const SPREADS_TYPES = new Set<string>([POLYMARKET_SPORTS_MARKET_TYPE.SPREADS, POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS]);

const TOTALS_TYPES = new Set<string>([
  POLYMARKET_SPORTS_MARKET_TYPE.TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_MATCH_TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_SET_HANDICAP,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_SET_TOTALS,
  POLYMARKET_SPORTS_MARKET_TYPE.TENNIS_FIRST_SET_TOTALS,
]);

export function getBetType(sportsMarketType: string | undefined): BetType {
  if (!sportsMarketType) return BET_TYPE.OTHER;
  if (MONEYLINE_TYPES.has(sportsMarketType)) return BET_TYPE.MONEYLINE;
  if (SPREADS_TYPES.has(sportsMarketType)) return BET_TYPE.SPREADS;
  if (TOTALS_TYPES.has(sportsMarketType)) return BET_TYPE.TOTALS;
  return BET_TYPE.OTHER;
}

export function isMoneylineMarketType(sportsMarketType: string | undefined): boolean {
  return !!sportsMarketType && MONEYLINE_TYPES.has(sportsMarketType);
}

type MinimalMarket = {
  outcomes: string[];
  sportsMarketType?: string;
};

// TODO: confirm this works when there are first half moneyline markets
export function isThreeWayMoneyline<T extends MinimalMarket>(markets: T[]): boolean {
  return (
    markets.length === 3 &&
    markets.every(
      m =>
        m.outcomes.length === 2 &&
        m.outcomes[0] === 'Yes' &&
        m.outcomes[1] === 'No' &&
        m.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE
    )
  );
}

type ActiveMarket = {
  active: boolean;
  closed: boolean;
  clobTokenIds: string[];
  sportsMarketType?: string;
};

export function isActiveMoneylineMarket(m: ActiveMarket): boolean {
  return m.active && !m.closed && m.clobTokenIds.length > 0 && isMoneylineMarketType(m.sportsMarketType);
}

export function isTeamBasedOutcome(outcome: string): boolean {
  const outcomeLowerCase = outcome.toLowerCase();
  if (outcomeLowerCase === 'yes' || outcomeLowerCase === 'no') return false;
  if (outcomeLowerCase === 'over' || outcomeLowerCase === 'under') return false;
  return true;
}
