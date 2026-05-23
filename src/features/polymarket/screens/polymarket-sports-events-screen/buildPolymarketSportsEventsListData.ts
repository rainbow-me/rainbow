import { getLeague, getLeagueId, getLeagueSlugId, LEAGUE_LIST_ORDER, type LeagueId } from '@/features/polymarket/leagues';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getSportsEventsDayBoundaries } from '@/features/polymarket/utils/getSportsEventsDateRange';
import * as i18n from '@/languages';

type EventItem = {
  type: 'event';
  key: string;
  event: PolymarketEvent;
};

type SectionHeaderItem = {
  type: 'header';
  key: string;
  title: string;
  count?: number;
  isLive?: boolean;
};

type LeagueHeaderItem = {
  type: 'league-header';
  key: string;
  title: string;
  eventSlug: string;
  leagueId?: LeagueId;
};

type SectionSeparatorItem = {
  type: 'separator';
  key: string;
};

type LeagueSeparatorItem = {
  type: 'league-separator';
  key: string;
};

export type SportsListItem = EventItem | SectionHeaderItem | LeagueHeaderItem | SectionSeparatorItem | LeagueSeparatorItem;

export function buildPolymarketSportsEventsListData(
  events: PolymarketEvent[],
  showLeagueHeaders: boolean,
  options: { referenceDate?: Date } = {}
): SportsListItem[] {
  if (!events.length) return [];

  const { startOfToday, startOfTomorrow, startOfNextWeek } = getSportsEventsDayBoundaries(options.referenceDate);
  const nowMs = (options.referenceDate ?? new Date()).getTime();
  const startOfTodayMs = startOfToday.getTime();
  const startOfTomorrowMs = startOfTomorrow.getTime();
  const startOfNextWeekMs = startOfNextWeek.getTime();

  const liveEvents: PolymarketEvent[] = [];
  const todayEvents: PolymarketEvent[] = [];
  const thisWeekEvents: PolymarketEvent[] = [];

  for (const event of events) {
    if (isLiveEvent(event, nowMs)) {
      liveEvents.push(event);
      continue;
    }

    const startTime = getTimestamp(event.startTime);
    const endTime = getTimestamp(event.endDate);
    const bucket = getTimeBucket({
      timestamp: startTime ?? endTime ?? startOfTodayMs,
      startOfTodayMs,
      startOfTomorrowMs,
      startOfNextWeekMs,
    });

    if (bucket === 'today') {
      todayEvents.push(event);
      continue;
    }
    if (bucket === 'this-week') {
      thisWeekEvents.push(event);
      continue;
    }

    if (startTime != null && endTime != null && startTime !== endTime) {
      const fallbackBucket = getTimeBucket({ timestamp: endTime, startOfTodayMs, startOfTomorrowMs, startOfNextWeekMs });
      if (fallbackBucket === 'today') {
        todayEvents.push(event);
      } else if (fallbackBucket === 'this-week') {
        thisWeekEvents.push(event);
      }
    }
  }

  const items: SportsListItem[] = [];
  const upcomingEvents = [...todayEvents, ...thisWeekEvents].sort(sortEventsByStartTime);

  if (liveEvents.length) {
    pushSection({
      events: liveEvents,
      header: { title: i18n.t(i18n.l.predictions.sports.live), count: liveEvents.length, isLive: true },
      items,
      sectionKey: 'live',
      showLeagueHeaders,
    });
  }

  pushSection({ items, events: upcomingEvents, sectionKey: 'upcoming', showLeagueHeaders });

  return items;
}

function isLiveEvent(event: PolymarketEvent, nowMs: number): boolean {
  if (event.ended) return false;
  if (event.live) return true;

  const startTime = getTimestamp(event.startTime);
  const endTime = getTimestamp(event.endDate);
  return startTime != null && endTime != null && startTime <= nowMs && nowMs <= endTime;
}

function pushSection({
  items,
  header,
  events,
  sectionKey,
  showLeagueHeaders,
}: {
  items: SportsListItem[];
  header?: { title: string; count?: number; isLive?: boolean };
  events: PolymarketEvent[];
  sectionKey: string;
  showLeagueHeaders: boolean;
}) {
  if (!events.length) return;
  if (header) {
    items.push({ type: 'header', key: `header-${sectionKey}`, title: header.title, count: header.count, isLive: header.isLive });
  }

  if (!showLeagueHeaders) {
    items.push(...buildEventItems(events, sectionKey));
    return;
  }

  const leagueGroups = groupEventsByLeague(events);
  for (let i = 0; i < leagueGroups.length; i++) {
    const group = leagueGroups[i];
    if (i > 0) {
      items.push({
        type: 'league-separator',
        key: `league-separator-${sectionKey}-${group.key}`,
      });
    }
    items.push({
      type: 'league-header',
      key: `league-${sectionKey}-${group.key}`,
      title: group.title,
      eventSlug: group.events[0].slug,
      leagueId: group.leagueId,
    });
    const expansionKey = `${sectionKey}-${group.key}`;
    items.push(...buildEventItems(group.events, expansionKey));
  }
}

function buildEventItems(events: PolymarketEvent[], sectionKey: string): EventItem[] {
  return events.map((event, index) => ({
    type: 'event',
    key: `event-${sectionKey}-${event.id}-${index}`,
    event,
  }));
}

function sortEventsByStartTime(a: PolymarketEvent, b: PolymarketEvent) {
  const aTime = getTimestamp(a.startTime) ?? getTimestamp(a.endDate) ?? Infinity;
  const bTime = getTimestamp(b.startTime) ?? getTimestamp(b.endDate) ?? Infinity;
  return aTime - bTime;
}

function groupEventsByLeague(events: PolymarketEvent[]) {
  const groups = new Map<string, { key: string; title: string; events: PolymarketEvent[]; leagueId?: LeagueId }>();
  for (const event of events) {
    const leagueId = getLeagueId(event.slug);
    const league = getLeague(event.slug);
    const leagueSlugId = getLeagueSlugId(event.slug);
    const key = leagueId ?? leagueSlugId ?? 'unknown';
    const title = league?.name ?? (leagueSlugId ? leagueSlugId.toUpperCase() : i18n.t(i18n.l.predictions.bet_types.other));
    const existing = groups.get(key) ?? { key, title, events: [], leagueId };
    existing.events.push(event);
    groups.set(key, existing);
  }

  for (const group of groups.values()) {
    group.events.sort((a, b) => {
      const aTime = getTimestamp(a.startTime) ?? Infinity;
      const bTime = getTimestamp(b.startTime) ?? Infinity;
      return aTime - bTime;
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    const aIndex = LEAGUE_LIST_ORDER.indexOf(a.key as (typeof LEAGUE_LIST_ORDER)[number]);
    const bIndex = LEAGUE_LIST_ORDER.indexOf(b.key as (typeof LEAGUE_LIST_ORDER)[number]);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

function getTimestamp(value?: string): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getTimeBucket({
  timestamp,
  startOfTodayMs,
  startOfTomorrowMs,
  startOfNextWeekMs,
}: {
  timestamp: number;
  startOfTodayMs: number;
  startOfTomorrowMs: number;
  startOfNextWeekMs: number;
}) {
  if (timestamp >= startOfTodayMs && timestamp < startOfTomorrowMs) return 'today';
  if (timestamp >= startOfTomorrowMs && timestamp < startOfNextWeekMs) return 'this-week';
  return null;
}
