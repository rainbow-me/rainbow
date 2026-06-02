import { type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { findSportsEventOutcome } from '@/features/polymarket/utils/sportsEventOutcome';

jest.mock('@/features/polymarket/utils/getMarketColor', () => ({
  getOutcomeColor: jest.fn(),
}));

describe('findSportsEventOutcome', () => {
  it('finds the market and outcome by clob token id', () => {
    const spreadMarket = createMarket({
      id: 'spread',
      clobTokenIds: ['spread-away-token', 'spread-home-token'],
      outcomes: ['Away +3.5', 'Home -3.5'],
    });
    const moneylineMarket = createMarket({
      id: 'moneyline',
      clobTokenIds: ['moneyline-away-token', 'moneyline-home-token'],
      outcomes: ['Away', 'Home'],
    });

    expect(findSportsEventOutcome([spreadMarket, moneylineMarket], 'moneyline-home-token')).toEqual({
      market: moneylineMarket,
      outcomeIndex: 1,
      outcome: 'Home',
    });
  });

  it('uses the group item title when the market provides one', () => {
    const market = createMarket({
      id: 'player-prop',
      clobTokenIds: ['over-token', 'under-token'],
      outcomes: ['Over', 'Under'],
      groupItemTitle: 'LeBron James',
    });

    expect(findSportsEventOutcome([market], 'under-token')).toEqual({
      market,
      outcomeIndex: 1,
      outcome: 'LeBron James',
    });
  });

  it('returns null when the token id is missing or unknown', () => {
    const market = createMarket({
      id: 'moneyline',
      clobTokenIds: ['away-token', 'home-token'],
      outcomes: ['Away', 'Home'],
    });

    expect(findSportsEventOutcome([market], undefined)).toBeNull();
    expect(findSportsEventOutcome([market], 'draw-token')).toBeNull();
  });
});

function createMarket({
  clobTokenIds,
  groupItemTitle = '',
  id,
  outcomes,
}: {
  id: string;
  clobTokenIds: string[];
  outcomes: string[];
  groupItemTitle?: string;
}): PolymarketMarket {
  return {
    id,
    clobTokenIds,
    groupItemTitle,
    outcomes,
  } as PolymarketMarket;
}
