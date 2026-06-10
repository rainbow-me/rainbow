import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

import { buildPolymarketSportsEventsListData, type SportsListItem } from './buildPolymarketSportsEventsListData';

// Resolve every event to one league so a single selected league yields one group.
jest.mock('@/features/polymarket/leagues', () => ({
  getLeague: () => ({ name: 'Test League' }),
  getLeagueId: () => 'nba',
  getLeagueSlugId: () => 'nba',
  LEAGUE_LIST_ORDER: ['nba'],
}));

jest.mock('@/languages', () => ({
  t: (key: string) => key,
  l: {
    predictions: { sports: { live: 'live' }, bet_types: { other: 'other' } },
    time: { today_caps: 'today' },
  },
  getDateFnsLocale: () => undefined,
}));

function makeEvent(id: string, startTime: string): PolymarketEvent {
  return { id, slug: `${id}-slug`, startTime, live: false, ended: false } as unknown as PolymarketEvent;
}

function eventIds(items: SportsListItem[]): string[] {
  return items.filter((item): item is Extract<SportsListItem, { type: 'event' }> => item.type === 'event').map(item => item.event.id);
}

describe('buildPolymarketSportsEventsListData', () => {
  // Regression guard for the single-league view: with league headers hidden the builder must still
  // sort by startTime rather than preserve the API's volume order (see Ivan/Codex review on #7536).
  it('orders single-league events by startTime when league headers are hidden', () => {
    const referenceDate = new Date(2026, 0, 15, 12, 0, 0);
    const at = (hour: number) => new Date(2026, 0, 15, hour, 0, 0).toISOString();

    // Intentionally non-chronological input (as the volume-ordered API would return).
    const events = [makeEvent('late', at(20)), makeEvent('early', at(14)), makeEvent('middle', at(18))];

    const items = buildPolymarketSportsEventsListData(events, false, { referenceDate });

    expect(eventIds(items)).toEqual(['early', 'middle', 'late']);
  });
});
