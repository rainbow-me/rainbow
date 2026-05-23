import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getTeamDisplayInfo } from '@/features/polymarket/utils/sportsEventTeams';

describe('getTeamDisplayInfo', () => {
  it('recovers esports team labels when sports team metadata is missing', () => {
    const event = buildEvent({
      title: 'LoL: Team WE vs LNG Esports (BO5) - LPL Play-In',
      markets: [buildMarket({ outcomes: ['Over', 'Under'] }), buildMarket({ outcomes: ['Team WE', 'LNG Esports'] })],
    });

    expect(getTeamDisplayInfo(event).labels).toEqual(['Team WE', 'LNG Esports']);
  });

  it('uses market outcomes when the title does not expose teams', () => {
    const event = buildEvent({
      title: 'First Blood in Game 2?',
      markets: [buildMarket({ outcomes: ['Team Falcons', 'MOUZ'] })],
    });

    expect(getTeamDisplayInfo(event).labels).toEqual(['Team Falcons', 'MOUZ']);
  });
});

function buildEvent({ markets, title }: { markets: PolymarketMarket[]; title: string }): PolymarketEvent {
  return {
    markets,
    title,
  } as PolymarketEvent;
}

function buildMarket({ outcomes }: { outcomes: string[] }): PolymarketMarket {
  return {
    outcomes,
  } as PolymarketMarket;
}
