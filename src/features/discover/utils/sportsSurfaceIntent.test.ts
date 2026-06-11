import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

import { selectSportsEventsForIntent } from './sportsSurfaceIntent';

function makeEvent(id: string, slug: string): PolymarketEvent {
  return { id, slug, live: false, ended: false } as unknown as PolymarketEvent;
}

describe('selectSportsEventsForIntent', () => {
  it('includes FIFA and FIFA World Cup events in the FIFA league intent', () => {
    const events = [makeEvent('fifa-event', 'fifa-club-world-cup'), makeEvent('fifwc-event', 'fifwc-world-cup-winner')];

    const selectedEvents = selectSportsEventsForIntent(events, { leagueId: 'fifa' });

    expect(selectedEvents.map(event => event.id)).toEqual(['fifa-event', 'fifwc-event']);
  });

  it('excludes non-FIFA events from the FIFA league intent', () => {
    const events = [makeEvent('fifa-event', 'fifa-club-world-cup'), makeEvent('epl-event', 'epl-title-winner')];

    const selectedEvents = selectSportsEventsForIntent(events, { leagueId: 'fifa' });

    expect(selectedEvents.map(event => event.id)).toEqual(['fifa-event']);
  });
});
