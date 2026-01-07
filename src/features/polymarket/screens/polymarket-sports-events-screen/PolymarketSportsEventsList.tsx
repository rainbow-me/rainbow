import { memo, useCallback, useMemo, RefObject } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View, ViewToken } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { Text, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { DEFAULT_SPORTS_LEAGUE_KEY, NAVIGATOR_FOOTER_CLEARANCE, NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import {
  PolymarketSportEventListItem,
  HEIGHT as ITEM_HEIGHT,
  LoadingSkeleton,
} from '@/features/polymarket/components/polymarket-sport-event-list-item/PolymarketSportEventListItem';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { getSportsEventsDayBoundaries } from '@/features/polymarket/utils/getSportsEventsDateRange';
import { getLeague, getLeagueId, getLeagueSlugId, LEAGUE_LIST_ORDER } from '@/features/polymarket/leagues';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import { addSubscribedTokens, removeSubscribedTokens, useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { useStableValue } from '@/hooks/useStableValue';
import { getSportsEventTokenIds } from '@/features/polymarket/utils/getSportsEventTokenIds';
import Routes from '@/navigation/routesNames';

const ITEM_GAP = 8;
const EMPTY_EVENTS: PolymarketEvent[] = [];
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50, minimumViewTime: 100 };

type SportsEventsListProps = {
  listRef?: RefObject<Animated.FlatList<unknown> | null>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

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

export const PolymarketSportsEventsList = memo(function PolymarketSportsEventsList({ listRef, onScroll }: SportsEventsListProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const events = usePolymarketSportsEventsStore(state => state.getData() ?? EMPTY_EVENTS);
  const selectedLeagueId = usePolymarketSportsEventsStore(state => state.selectedLeagueId);
  const isLoading = usePolymarketSportsEventsStore(state => state.getStatus('isLoading'));

  const filteredEvents = useMemo(() => {
    if (!selectedLeagueId || selectedLeagueId === DEFAULT_SPORTS_LEAGUE_KEY) return events;
    return events.filter(event => getLeagueId(event.slug) === selectedLeagueId);
  }, [events, selectedLeagueId]);

  const showLeagueHeaders = !selectedLeagueId || selectedLeagueId === DEFAULT_SPORTS_LEAGUE_KEY;
  const listData = useMemo(() => buildListData(filteredEvents, showLeagueHeaders), [filteredEvents, showLeagueHeaders]);

  const listStyles = useMemo(() => {
    const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;
    return {
      contentContainerStyle: { minHeight: DEVICE_HEIGHT, paddingBottom, paddingHorizontal: 12, paddingTop: 28 },
      scrollIndicatorInsets: { bottom: paddingBottom },
    };
  }, [safeAreaInsets.bottom]);

  const debouncedAddSubscribedTokens = useStableValue(() =>
    debounce((viewableItems: Array<ViewToken<SportsListItem>>) => {
      const viewableTokenIds = extractEventTokenIds(viewableItems);
      if (viewableTokenIds.length > 0) {
        addSubscribedTokens({ route: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN, tokenIds: viewableTokenIds });
        useLiveTokensStore.getState().fetch(undefined, { force: true });
      }
    }, 250)
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems, changed }: { viewableItems: Array<ViewToken<SportsListItem>>; changed: Array<ViewToken<SportsListItem>> }) => {
      const removedItems = changed.filter(item => !item.isViewable);
      const removedTokenIds = extractEventTokenIds(removedItems);

      if (removedTokenIds.length > 0) {
        removeSubscribedTokens({ route: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN, tokenIds: removedTokenIds });
      }

      debouncedAddSubscribedTokens(viewableItems);
    },
    [debouncedAddSubscribedTokens]
  );

  const renderItem = useCallback(({ item }: { item: SportsListItem }) => {
    if (item.type === 'header') {
      return <SectionHeader isLive={item.isLive} title={item.title} />;
    }
    if (item.type === 'league-header') {
      return <LeagueHeader title={item.title} eventSlug={item.eventSlug} />;
    }
    if (item.type === 'separator') {
      return <SectionSeparator />;
    }
    if (item.type === 'league-separator') {
      return <LeagueSeparator />;
    }
    return <PolymarketSportEventListItem event={item.event} style={styles.eventItemWrapper} />;
  }, []);

  return (
    <Animated.FlatList
      ListEmptyComponent={isLoading ? <ListLoadingSkeleton /> : <EmptyState />}
      contentContainerStyle={listStyles.contentContainerStyle}
      data={listData}
      scrollEnabled={listData.length > 0 && !isLoading}
      initialNumToRender={10}
      keyExtractor={keyExtractor}
      maxToRenderPerBatch={10}
      onScroll={onScroll}
      onViewableItemsChanged={handleViewableItemsChanged}
      ref={listRef}
      renderItem={renderItem}
      scrollIndicatorInsets={listStyles.scrollIndicatorInsets}
      style={styles.list}
      viewabilityConfig={VIEWABILITY_CONFIG}
      windowSize={12}
    />
  );
});

const ListLoadingSkeleton = memo(function ListLoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.skeletonItemWrapper}>
          <LoadingSkeleton />
        </View>
      ))}
    </View>
  );
});

const EmptyState = memo(function EmptyState() {
  return (
    <View style={styles.emptyStateContainer}>
      <Text align="center" color="labelSecondary" size="17pt" weight="bold">
        {i18n.t(i18n.l.predictions.sports.no_games)}
      </Text>
    </View>
  );
});

const SectionHeader = memo(function SectionHeader({ title, isLive }: { title: string; isLive?: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderContent}>
        {isLive ? <View style={[styles.liveIndicator, { backgroundColor: '#FF584D' }]} /> : null}
        <Text align="left" color="label" size="20pt" weight="heavy">
          {title}
        </Text>
      </View>
    </View>
  );
});

const LeagueHeader = memo(function LeagueHeader({ title, eventSlug }: { title: string; eventSlug: string }) {
  return (
    <View style={styles.leagueHeader}>
      <LeagueIcon eventSlug={eventSlug} size={28} />
      <Text align="left" color="label" size="22pt" weight="heavy">
        {title}
      </Text>
    </View>
  );
});

const SectionSeparator = memo(function SectionSeparator() {
  const separatorColor = useForegroundColor('separatorSecondary');
  return (
    <View style={styles.sectionSeparatorContainer}>
      <View style={[styles.sectionSeparatorLine, { backgroundColor: separatorColor }]} />
    </View>
  );
});

const LeagueSeparator = memo(function LeagueSeparator() {
  const separatorColor = useForegroundColor('separatorSecondary');
  return (
    <View style={styles.leagueSeparatorContainer}>
      <View style={[styles.sectionSeparatorLine, { backgroundColor: separatorColor }]} />
    </View>
  );
});

function keyExtractor(item: SportsListItem): string {
  return item.key;
}

function extractEventTokenIds(viewTokens: Array<ViewToken<SportsListItem>>): string[] {
  const tokenIds = new Set<string>();
  for (const viewToken of viewTokens) {
    const item = viewToken.item;
    if (item?.type !== 'event') continue;
    const eventTokenIds = getSportsEventTokenIds(item.event);
    for (const tokenId of eventTokenIds) {
      tokenIds.add(tokenId);
    }
  }
  return Array.from(tokenIds);
}

function buildListData(events: PolymarketEvent[], showLeagueHeaders: boolean): SportsListItem[] {
  if (!events.length) return [];

  const { startOfToday, startOfTomorrow, startOfDayAfterTomorrow } = getSportsEventsDayBoundaries();
  const startOfTodayMs = startOfToday.getTime();
  const startOfTomorrowMs = startOfTomorrow.getTime();
  const startOfDayAfterTomorrowMs = startOfDayAfterTomorrow.getTime();

  const liveEvents: PolymarketEvent[] = [];
  const todayEvents: PolymarketEvent[] = [];
  const tomorrowEvents: PolymarketEvent[] = [];

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
      startOfDayAfterTomorrowMs,
    });

    if (bucket === 'today') {
      todayEvents.push(event);
      continue;
    }
    if (bucket === 'tomorrow') {
      tomorrowEvents.push(event);
      continue;
    }

    if (startTime != null && endTime != null && startTime !== endTime) {
      const fallbackBucket = getTimeBucket({ timestamp: endTime, startOfTodayMs, startOfTomorrowMs, startOfDayAfterTomorrowMs });
      if (fallbackBucket === 'today') {
        todayEvents.push(event);
      } else if (fallbackBucket === 'tomorrow') {
        tomorrowEvents.push(event);
      }
    }
  }

  const items: SportsListItem[] = [];
  const tomorrowLabel = format(startOfTomorrow, 'EEE, MMM d', { locale: i18n.getDateFnsLocale() });

  const sections = [
    { key: 'live', title: i18n.t(i18n.l.predictions.sports.live), events: liveEvents },
    { key: 'today', title: i18n.t(i18n.l.time.today_caps), events: todayEvents },
    { key: 'tomorrow', title: tomorrowLabel, events: tomorrowEvents },
  ];

  for (const section of sections) {
    if (!section.events.length) continue;
    if (items.length) {
      items.push({ type: 'separator', key: `separator-${section.key}` });
    }
    pushSection({ items, title: section.title, events: section.events, sectionKey: section.key, showLeagueHeaders });
  }

  return items;
}

function pushSection({
  items,
  title,
  events,
  sectionKey,
  showLeagueHeaders,
}: {
  items: SportsListItem[];
  title: string;
  events: PolymarketEvent[];
  sectionKey: string;
  showLeagueHeaders: boolean;
}) {
  if (!events.length) return;
  items.push({ type: 'header', key: `header-${sectionKey}`, title, isLive: sectionKey === 'live' });
  const leagueGroups = groupEventsByLeague(events);
  for (let i = 0; i < leagueGroups.length; i++) {
    const group = leagueGroups[i];
    if (showLeagueHeaders) {
      if (i > 0) {
        items.push({ type: 'league-separator', key: `league-separator-${sectionKey}-${group.key}` });
      }
      items.push({ type: 'league-header', key: `league-${sectionKey}-${group.key}`, title: group.title, eventSlug: group.events[0].slug });
    }
    items.push(...buildEventItems(group.events, `${sectionKey}-${group.key}`));
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
  const groups = new Map<string, { key: string; title: string; events: PolymarketEvent[] }>();
  for (const event of events) {
    const leagueId = getLeagueId(event.slug);
    const league = getLeague(event.slug);
    const leagueSlugId = getLeagueSlugId(event.slug);
    const key = leagueId ?? leagueSlugId ?? 'unknown';
    const title = league?.name ?? (leagueSlugId ? leagueSlugId.toUpperCase() : i18n.t(i18n.l.predictions.bet_types.other));
    const existing = groups.get(key) ?? { key, title, events: [] };
    existing.events.push(event);
    groups.set(key, existing);
  }

  // Sort events within each group by earliest start time
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
}) {
  if (timestamp >= startOfTodayMs && timestamp < startOfTomorrowMs) return 'today';
  if (timestamp >= startOfTomorrowMs && timestamp < startOfDayAfterTomorrowMs) return 'tomorrow';
  return null;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  eventItemWrapper: {
    marginBottom: ITEM_GAP,
  },
  sectionHeader: {
    paddingLeft: 12,
    marginBottom: 16,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    height: 24,
    paddingLeft: 12,
  },
  skeletonContainer: {
    flex: 1,
    gap: ITEM_GAP,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  skeletonItemWrapper: {
    height: ITEM_HEIGHT,
    width: '100%',
  },
  sectionSeparatorContainer: {
    paddingTop: 20 - ITEM_GAP,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  leagueSeparatorContainer: {
    paddingTop: 12 - ITEM_GAP / 2,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  sectionSeparatorLine: {
    height: 1,
    width: '100%',
  },
});
