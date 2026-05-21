import { getLeague, getLeagueId, getLeagueSlugId, LEAGUE_LIST_ORDER, type LeagueId } from '@/features/polymarket/leagues';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getSportsEventsDayBoundaries } from '@/features/polymarket/utils/getSportsEventsDateRange';
import * as i18n from '@/languages';

const DISCOVER_PREVIEW_EVENT_COUNT = 2;

type EventItem = {
  type: 'event';
  key: string;
  event: PolymarketEvent;
  enterAnimationIndex?: number;
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

type ShowMoreItem = {
  type: 'show-more';
  key: string;
  count: number;
  expansionKey: string;
};

export type SportsListItem = EventItem | SectionHeaderItem | LeagueHeaderItem | SectionSeparatorItem | LeagueSeparatorItem | ShowMoreItem;

export function buildPolymarketSportsEventsListData(
  events: PolymarketEvent[],
  showLeagueHeaders: boolean,
  options: { expandedKeys: ReadonlySet<string>; referenceDate?: Date; truncateSections: boolean }
): SportsListItem[] {
  if (!events.length) return [];

  const { startOfToday, startOfTomorrow, startOfNextWeek } = getSportsEventsDayBoundaries(options.referenceDate);
  const startOfTodayMs = startOfToday.getTime();
  const startOfTomorrowMs = startOfTomorrow.getTime();
  const startOfNextWeekMs = startOfNextWeek.getTime();

  const liveEvents: PolymarketEvent[] = [];
  const todayEvents: PolymarketEvent[] = [];
  const thisWeekEvents: PolymarketEvent[] = [];

  for (const event of events) {
    if (event.live && !event.ended) {
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

  const sections = [
    { key: 'live', title: i18n.t(i18n.l.predictions.sports.live), events: liveEvents },
    { key: 'today', title: i18n.t(i18n.l.time.today_caps), events: todayEvents },
    { key: 'this-week', title: i18n.t(i18n.l.predictions.sports.this_week), events: thisWeekEvents },
  ];

  for (const section of sections) {
    if (!section.events.length) continue;
    if (items.length) {
      items.push({ type: 'separator', key: `separator-${section.key}` });
    }
    pushSection({ items, title: section.title, events: section.events, sectionKey: section.key, showLeagueHeaders, ...options });
  }

  return items;
}

function pushSection({
  items,
  title,
  events,
  sectionKey,
  showLeagueHeaders,
  expandedKeys,
  truncateSections,
}: {
  items: SportsListItem[];
  title: string;
  events: PolymarketEvent[];
  sectionKey: string;
  showLeagueHeaders: boolean;
  expandedKeys: ReadonlySet<string>;
  truncateSections: boolean;
}) {
  if (!events.length) return;
  items.push({ type: 'header', key: `header-${sectionKey}`, title, count: events.length, isLive: sectionKey === 'live' });

  if (truncateSections && sectionKey === 'live') {
    pushPreviewEvents({ events, expansionKey: sectionKey, items, sectionKey, expandedKeys });
    return;
  }

  if (!showLeagueHeaders) {
    pushPreviewEvents({ events, expansionKey: sectionKey, items, sectionKey, expandedKeys: truncateSections ? expandedKeys : null });
    return;
  }

  const leagueGroups = groupEventsByLeague(events);
  for (let i = 0; i < leagueGroups.length; i++) {
    const group = leagueGroups[i];
    if (i > 0) {
      items.push({ type: 'league-separator', key: `league-separator-${sectionKey}-${group.key}` });
    }
    items.push({
      type: 'league-header',
      key: `league-${sectionKey}-${group.key}`,
      title: group.title,
      eventSlug: group.events[0].slug,
      leagueId: group.leagueId,
    });
    const expansionKey = `${sectionKey}-${group.key}`;
    pushPreviewEvents({
      events: group.events,
      expansionKey,
      items,
      sectionKey: expansionKey,
      expandedKeys: truncateSections ? expandedKeys : null,
    });
  }
}

function pushPreviewEvents({
  events,
  expansionKey,
  items,
  sectionKey,
  expandedKeys,
}: {
  events: PolymarketEvent[];
  expansionKey: string;
  items: SportsListItem[];
  sectionKey: string;
  expandedKeys: ReadonlySet<string> | null;
}) {
  const shouldTruncate = expandedKeys != null && !expandedKeys.has(expansionKey) && events.length > DISCOVER_PREVIEW_EVENT_COUNT;
  const visibleEvents = shouldTruncate ? events.slice(0, DISCOVER_PREVIEW_EVENT_COUNT) : events;
  const shouldAnimateExpandedEvents =
    expandedKeys != null && expandedKeys.has(expansionKey) && events.length > DISCOVER_PREVIEW_EVENT_COUNT;
  items.push(...buildEventItems(visibleEvents, sectionKey, shouldAnimateExpandedEvents ? DISCOVER_PREVIEW_EVENT_COUNT : null));

  const remainingCount = events.length - visibleEvents.length;
  if (remainingCount > 0) {
    items.push({ type: 'show-more', key: `show-more-${expansionKey}`, count: remainingCount, expansionKey });
  }
}

function buildEventItems(events: PolymarketEvent[], sectionKey: string, animatedStartIndex: number | null): EventItem[] {
  return events.map((event, index) => ({
    type: 'event',
    key: `event-${sectionKey}-${event.id}-${index}`,
    event,
    ...(animatedStartIndex != null && index >= animatedStartIndex ? { enterAnimationIndex: index - animatedStartIndex } : {}),
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
