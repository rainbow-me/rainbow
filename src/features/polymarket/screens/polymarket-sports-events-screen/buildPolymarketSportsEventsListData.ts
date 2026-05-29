import { format } from 'date-fns';

import { getLeague, getLeagueId, getLeagueSlugId, LEAGUE_LIST_ORDER, type LeagueId } from '@/features/polymarket/leagues';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getSportsEventsDayBoundaries } from '@/features/polymarket/utils/getSportsEventsDateRange';
import * as i18n from '@/languages';

export type SportsEventScheduleBucket = 'live' | 'today' | 'tomorrow';

type EventItem = {
  type: 'event';
  key: string;
  event: PolymarketEvent;
};

type SectionHeaderItem = {
  type: 'header';
  key: string;
  title: string;
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

  const referenceDate = options.referenceDate ?? new Date();
  const { startOfTomorrow } = getSportsEventsDayBoundaries(referenceDate);

  const liveEvents: PolymarketEvent[] = [];
  const todayEvents: PolymarketEvent[] = [];
  const tomorrowEvents: PolymarketEvent[] = [];

  for (const event of events) {
    const bucket = getSportsEventScheduleBucket(event, referenceDate);

    if (bucket === 'live') {
      liveEvents.push(event);
      continue;
    }
    if (bucket === 'today') {
      todayEvents.push(event);
      continue;
    }
    if (bucket === 'tomorrow') {
      tomorrowEvents.push(event);
    }
  }

  const items: SportsListItem[] = [];
  const tomorrowLabel = format(startOfTomorrow, 'EEE, MMM d', { locale: i18n.getDateFnsLocale() });

  const sections = [
    { key: 'live', title: i18n.t(i18n.l.predictions.sports.live), isLive: true, events: liveEvents },
    { key: 'today', title: i18n.t(i18n.l.time.today_caps), events: todayEvents },
    { key: 'tomorrow', title: tomorrowLabel, events: tomorrowEvents },
  ];

  for (const section of sections) {
    if (!section.events.length) continue;
    if (items.length) {
      items.push({ type: 'separator', key: `separator-${section.key}` });
    }
    pushSection({
      events: section.events,
      header: { title: section.title, isLive: section.isLive },
      items,
      sectionKey: section.key,
      showLeagueHeaders,
    });
  }

  return items;
}

export function isLiveSportsEvent(event: PolymarketEvent): boolean {
  if (event.ended) return false;
  return event.live === true;
}

export function getSportsEventScheduleBucket(event: PolymarketEvent, referenceDate: Date = new Date()): SportsEventScheduleBucket | null {
  if (isLiveSportsEvent(event)) return 'live';

  const { startOfToday, startOfTomorrow, startOfDayAfterTomorrow } = getSportsEventsDayBoundaries(referenceDate);
  const startOfTodayMs = startOfToday.getTime();
  const startOfTomorrowMs = startOfTomorrow.getTime();
  const startOfDayAfterTomorrowMs = startOfDayAfterTomorrow.getTime();
  const startTime = getTimestamp(event.startTime);
  const endTime = getTimestamp(event.endDate);
  const bucket = getTimeBucket({
    timestamp: startTime ?? endTime ?? startOfTodayMs,
    startOfDayAfterTomorrowMs,
    startOfTodayMs,
    startOfTomorrowMs,
  });
  if (bucket) return bucket;

  if (startTime == null || endTime == null || startTime === endTime) return null;
  return getTimeBucket({
    timestamp: endTime,
    startOfDayAfterTomorrowMs,
    startOfTodayMs,
    startOfTomorrowMs,
  });
}

function pushSection({
  items,
  header,
  events,
  sectionKey,
  showLeagueHeaders,
}: {
  items: SportsListItem[];
  header?: { title: string; isLive?: boolean };
  events: PolymarketEvent[];
  sectionKey: string;
  showLeagueHeaders: boolean;
}) {
  if (!events.length) return;
  if (header) {
    items.push({ type: 'header', key: `header-${sectionKey}`, title: header.title, isLive: header.isLive });
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
  startOfDayAfterTomorrowMs,
}: {
  timestamp: number;
  startOfTodayMs: number;
  startOfTomorrowMs: number;
  startOfDayAfterTomorrowMs: number;
}): SportsEventScheduleBucket | null {
  if (timestamp >= startOfTodayMs && timestamp < startOfTomorrowMs) return 'today';
  if (timestamp >= startOfTomorrowMs && timestamp < startOfDayAfterTomorrowMs) return 'tomorrow';
  return null;
}
