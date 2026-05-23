import { memo, useCallback, useMemo, type RefObject } from 'react';
import { StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewToken } from 'react-native';

import { debounce } from 'lodash';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/Skeleton';
import { Text, useBackgroundColor } from '@/design-system';
import { LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import {
  HEIGHT as ITEM_HEIGHT,
  LoadingSkeleton,
  PolymarketSportEventListItem,
} from '@/features/polymarket/components/polymarket-sport-event-list-item/PolymarketSportEventListItem';
import { DEFAULT_SPORTS_LEAGUE_KEY, NAVIGATOR_FOOTER_CLEARANCE, NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { getLeagueId, type LeagueId } from '@/features/polymarket/leagues';
import {
  buildPolymarketSportsEventsListData,
  type SportsListItem,
} from '@/features/polymarket/screens/polymarket-sports-events-screen/buildPolymarketSportsEventsListData';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getSportsEventTokenIds } from '@/features/polymarket/utils/sportsEventBetData';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { addSubscribedTokens, removeSubscribedTokens, useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

const ITEM_GAP = 8;
const EMPTY_EVENTS: PolymarketEvent[] = [];
const LIVE_INDICATOR_SIZE = 28;
const LIVE_INDICATOR_CUTOUT_SIZE = 16;
const LIVE_INDICATOR_DOT_SIZE = 8;
const SKELETON_SECTIONS = [
  { key: 'live', titleWidth: 54, itemCount: 1, showHeader: true, showLiveIndicator: true },
  { key: 'upcoming', itemCount: 2, showHeader: false, showLiveIndicator: false },
] as const;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50, minimumViewTime: 100 };

type SportsEventsListProps = {
  listRef?: RefObject<Animated.FlatList<unknown> | null>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

type SportsEventsListContentProps = SportsEventsListProps & {
  events: PolymarketEvent[];
  isIdle: boolean;
  isLoading: boolean;
  selectedLeagueId: string;
};

export const PolymarketSportsEventsList = memo(function PolymarketSportsEventsList({ listRef, onScroll }: SportsEventsListProps) {
  const events = usePolymarketSportsEventsStore(state => state.getData() ?? EMPTY_EVENTS);
  const selectedLeagueId = usePolymarketSportsEventsStore(state => state.selectedLeagueId);
  const isLoading = usePolymarketSportsEventsStore(state => state.getStatus('isLoading'));
  const isIdle = usePolymarketSportsEventsStore(state => state.getStatus('isIdle'));

  return (
    <PolymarketSportsEventsListContent
      events={events}
      isIdle={isIdle}
      isLoading={isLoading}
      listRef={listRef}
      onScroll={onScroll}
      selectedLeagueId={selectedLeagueId}
    />
  );
});

export const PolymarketSportsEventsListContent = memo(function PolymarketSportsEventsListContent({
  events,
  isIdle,
  isLoading,
  listRef,
  onScroll,
  selectedLeagueId,
}: SportsEventsListContentProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const showLeagueHeaders = !selectedLeagueId || selectedLeagueId === DEFAULT_SPORTS_LEAGUE_KEY;

  const filteredEvents = useMemo(() => {
    if (showLeagueHeaders) return events;
    return events.filter(event => getLeagueId(event.slug) === selectedLeagueId);
  }, [events, showLeagueHeaders, selectedLeagueId]);

  const listData = useMemo(
    () => buildPolymarketSportsEventsListData(filteredEvents, showLeagueHeaders),
    [filteredEvents, showLeagueHeaders]
  );
  const showLoadingSkeleton = !listData.length && (isLoading || isIdle);

  const listStyles = useMemo(() => {
    const paddingBottom = safeAreaInsets.bottom + NAVIGATOR_FOOTER_HEIGHT + NAVIGATOR_FOOTER_CLEARANCE;
    const shouldFillViewport = showLoadingSkeleton || listData.length === 0;
    return {
      contentContainerStyle: {
        flexGrow: shouldFillViewport ? 1 : undefined,
        paddingBottom,
        paddingHorizontal: 12,
        paddingTop: 28,
      },
      scrollIndicatorInsets: { bottom: paddingBottom },
    };
  }, [listData.length, safeAreaInsets.bottom, showLoadingSkeleton]);

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
      return <SectionHeader count={item.count} isLive={item.isLive} title={item.title} />;
    }
    if (item.type === 'league-header') {
      return <LeagueHeader eventSlug={item.eventSlug} leagueId={item.leagueId} title={item.title} />;
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
      ListEmptyComponent={showLoadingSkeleton ? <ListLoadingSkeleton /> : <EmptyState />}
      contentContainerStyle={listStyles.contentContainerStyle}
      data={listData}
      scrollEnabled={listData.length > 0 && !showLoadingSkeleton}
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
      {SKELETON_SECTIONS.map((section, sectionIndex) => (
        <View key={section.key} style={sectionIndex > 0 && styles.skeletonSectionSpacing}>
          {section.showHeader ? (
            <View style={styles.skeletonSectionHeader}>
              {section.showLiveIndicator ? <Skeleton height={8} width={8} /> : null}
              <Skeleton height={24} width={section.titleWidth} />
              <Skeleton height={23} width={24} />
            </View>
          ) : null}
          {Array.from({ length: section.itemCount }).map((_, index) => (
            <View key={index} style={styles.skeletonItemWrapper}>
              <LoadingSkeleton />
            </View>
          ))}
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

const SectionHeader = memo(function SectionHeader({ title, count, isLive }: { title: string; count?: number; isLive?: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderContent}>
        {isLive ? <LiveSectionIndicator /> : null}
        <Text align="left" color="label" size="20pt" weight="heavy">
          {title}
        </Text>
        {typeof count === 'number' ? (
          <View style={styles.countBadge}>
            <Text color={{ custom: '#FFFFFF' }} size="13pt" style={styles.countBadgeText} weight="heavy">
              {count}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const LiveSectionIndicator = memo(function LiveSectionIndicator() {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  return (
    <View style={styles.liveIndicatorOuter}>
      <View style={[styles.liveIndicatorCutout, { backgroundColor }]}>
        <View style={styles.liveIndicatorDot} />
      </View>
    </View>
  );
});

const LeagueHeader = memo(function LeagueHeader({ title, eventSlug, leagueId }: { title: string; eventSlug: string; leagueId?: LeagueId }) {
  return (
    <View style={styles.leagueHeader}>
      {leagueId ? <LeagueIcon leagueId={leagueId} size={28} /> : <LeagueIcon eventSlug={eventSlug} size={28} />}
      <Text align="left" color="label" size="22pt" weight="heavy">
        {title}
      </Text>
    </View>
  );
});

const SectionSeparator = memo(function SectionSeparator() {
  return <View style={styles.sectionSeparatorContainer} />;
});

const LeagueSeparator = memo(function LeagueSeparator() {
  return <View style={styles.leagueSeparatorContainer} />;
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
    gap: 10,
  },
  liveIndicatorCutout: {
    alignItems: 'center',
    borderRadius: LIVE_INDICATOR_CUTOUT_SIZE / 2,
    height: LIVE_INDICATOR_CUTOUT_SIZE,
    justifyContent: 'center',
    width: LIVE_INDICATOR_CUTOUT_SIZE,
  },
  liveIndicatorDot: {
    backgroundColor: '#F04F4B',
    borderRadius: LIVE_INDICATOR_DOT_SIZE / 2,
    height: LIVE_INDICATOR_DOT_SIZE,
    width: LIVE_INDICATOR_DOT_SIZE,
  },
  liveIndicatorOuter: {
    alignItems: 'center',
    backgroundColor: 'rgba(240, 79, 75, 0.34)',
    borderRadius: LIVE_INDICATOR_SIZE / 2,
    height: LIVE_INDICATOR_SIZE,
    justifyContent: 'center',
    width: LIVE_INDICATOR_SIZE,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.19)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    borderWidth: 1.333,
    height: 23,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 7,
  },
  countBadgeText: {
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 14,
    transform: [{ translateY: 1 }],
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
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  skeletonItemWrapper: {
    height: ITEM_HEIGHT,
    marginBottom: ITEM_GAP,
    width: '100%',
  },
  skeletonSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    paddingLeft: 12,
  },
  skeletonSectionSpacing: {
    paddingTop: 20 - ITEM_GAP,
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
});
