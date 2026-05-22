import {
  buildPolymarketSportsEventsListData,
  type SportsListItem,
} from '@/features/polymarket/screens/polymarket-sports-events-screen/buildPolymarketSportsEventsListData';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

function event({ id, live = false, startTime }: { id: string; live?: boolean; startTime: Date }): PolymarketEvent {
  return {
    id,
    endDate: startTime.toISOString(),
    ended: false,
    live,
    markets: [],
    slug: `nba-${id}-2026-05-21`,
    startTime: startTime.toISOString(),
    title: id,
  } as unknown as PolymarketEvent;
}

function getHeaders(items: SportsListItem[]): string[] {
  return items.filter(item => item.type === 'header').map(item => item.title);
}

function getEventIds(items: SportsListItem[]): string[] {
  return items.filter(item => item.type === 'event').map(item => item.event.id);
}

describe('PolymarketSportsEventsList', () => {
  it('keeps Live headed and combines non-live games into one unheaded section', () => {
    const referenceDate = new Date(2026, 4, 21, 12);
    const items = buildPolymarketSportsEventsListData(
      [
        event({ id: 'live-game', live: true, startTime: new Date(2026, 4, 21, 13) }),
        event({ id: 'this-week-game', startTime: new Date(2026, 4, 22, 20) }),
        event({ id: 'today-game', startTime: new Date(2026, 4, 21, 20) }),
      ],
      false,
      { expandedKeys: new Set(), referenceDate, truncateSections: false }
    );

    expect(getHeaders(items)).toEqual(['Live']);
    expect(getEventIds(items)).toEqual(['live-game', 'today-game', 'this-week-game']);
    expect(items.some(item => item.type === 'separator')).toBe(false);
  });
});
