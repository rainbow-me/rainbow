import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type ViewToken,
} from 'react-native';

import { deepEqual } from '@storesjs/stores';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { findScope, hasCompetitionDirectory, type SportsHost } from '@/features/sports/core/browse';
import { getSportsSections, type SportsSection } from '@/features/sports/core/sections';
import { getSportsResult, sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { GameCarousel } from '@/features/sports/ui/GameCarousel';
import { SportsDirectory } from '@/features/sports/ui/SportsDirectory';
import { SportsHeader, SportsScopeBar } from '@/features/sports/ui/SportsNavigation';
import { SportsSearch } from '@/features/sports/ui/SportsSearch';
import { SportsSurface } from '@/features/sports/ui/SportsSurface';
import { useSportsHost } from '@/features/sports/ui/useSportsHost';
import { useSportsQuotes } from '@/features/sports/ui/useSportsQuotes';
import * as i18n from '@/languages';
import { type Route } from '@/navigation/routesNames';

export type SportsBrowseHandle = { scrollToTop: () => void };

type Row =
  | { key: string; type: 'heading'; section: SportsSection; title: string }
  | { key: string; type: 'carousel'; section: SportsSection }
  | { key: string; type: 'game'; gameId: string; scopeId?: string }
  | { key: string; type: 'expand'; sectionKey: string; remaining: number; expanded: boolean };

export function SportsBrowse({
  host,
  visible,
  route,
  topInset = 0,
  bottomInset,
  onGamePress,
  onScroll,
  ref,
}: {
  host: SportsHost;
  visible: boolean;
  route: Route;
  topInset?: number;
  bottomInset: number;
  onGamePress: SportsGamePress;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  ref?: Ref<SportsBrowseHandle>;
}) {
  const active = useSportsHost(host, visible);
  const { isDarkMode } = useColorMode();
  const list = useRef<FlatList<Row>>(null);
  const [expanded, setExpanded] = useState(new Set<string>());
  const [visibleCarousels, setVisibleCarousels] = useState(new Set<string>());
  const view = useSportsStore(state => {
    const { request } = state.hosts[host];
    const result = getSportsResult(state, host);
    const sections = getSportsSections({
      catalog: state.catalog,
      games: state.games,
      gameIds: result?.gameIds ?? [],
      destination: request.destination,
      search: request.query !== null,
    });
    return { destination: request.destination, query: request.query, sections, catalog: state.catalog };
  }, deepEqual);

  const rows = useMemo(() => {
    const rows: Row[] = [];
    for (const section of view.sections) {
      const key = section.scopeId ?? section.type;
      const title = section.scopeId ? (findScope(view.catalog, section.scopeId)?.name ?? '') : i18n.t(SECTION_LABELS[section.type]);
      rows.push({ key: `heading:${key}`, type: 'heading', section, title });
      if (view.query === null && view.destination.type === 'live') {
        rows.push({ key: `carousel:${key}`, type: 'carousel', section });
        continue;
      }
      const count = view.query !== null || expanded.has(key) ? section.gameIds.length : 2;
      for (const gameId of section.gameIds.slice(0, count))
        rows.push({
          key: `game:${gameId}`,
          type: 'game',
          gameId,
          scopeId: view.destination.type === 'scope' ? view.destination.scopeId : section.scopeId,
        });
      if (view.query === null && section.gameIds.length > 2)
        rows.push({
          key: `expand:${key}`,
          type: 'expand',
          sectionKey: key,
          remaining: section.gameIds.length - 2,
          expanded: expanded.has(key),
        });
    }
    return rows;
  }, [view, expanded]);

  const renderedGameIds = useMemo(() => rows.flatMap(row => (row.type === 'game' ? [row.gameId] : [])), [rows]);
  const setVisibleGames = useSportsQuotes(route, active, renderedGameIds);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Row>[] }) => {
      setVisibleGames(viewableItems.flatMap(({ item }) => (item.type === 'game' ? [item.gameId] : [])));
      const keys = new Set(viewableItems.flatMap(({ item }) => (item.type === 'carousel' ? [item.key] : [])));
      setVisibleCarousels(previous => (previous.size === keys.size && [...keys].every(key => previous.has(key)) ? previous : keys));
    },
    [setVisibleGames]
  );

  useImperativeHandle(ref, () => ({ scrollToTop: () => list.current?.scrollToOffset({ offset: 0, animated: true }) }), []);
  useEffect(() => {
    list.current?.scrollToOffset({ offset: 0, animated: false });
    setExpanded(new Set());
  }, [view.destination, view.query]);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      switch (item.type) {
        case 'game':
          return (
            <View style={styles.card}>
              <GameCard gameId={item.gameId} scopeId={item.scopeId} onPress={onGamePress} />
            </View>
          );
        case 'heading':
          return <SectionHeading title={item.title} section={item.section} host={host} />;
        case 'carousel':
          return (
            <GameCarousel
              section={item.section}
              route={route}
              visible={active && visibleCarousels.has(item.key)}
              onGamePress={onGamePress}
            />
          );
        case 'expand':
          return (
            <ButtonPressAnimation
              onPress={() =>
                setExpanded(previous => {
                  const next = new Set(previous);
                  if (next.has(item.sectionKey)) next.delete(item.sectionKey);
                  else next.add(item.sectionKey);
                  return next;
                })
              }
              scaleTo={0.98}
            >
              <View style={styles.expand}>
                <SportsSurface
                  borderRadius={10}
                  color={isDarkMode ? 'rgba(255,255,255,0.16)' : undefined}
                  gradient={isDarkMode ? undefined : LIGHT_BADGE_GRADIENT}
                  borderColor={isDarkMode ? undefined : '#FFFFFF'}
                  borderWidth={4 / 3}
                  shadows={isDarkMode ? undefined : LIGHT_BADGE_SHADOWS}
                  style={styles.expandIcon}
                >
                  <TextIcon
                    color={isDarkMode ? 'labelQuaternary' : 'labelTertiary'}
                    size="10pt"
                    weight="black"
                    width={16}
                    height={8}
                    textStyle={styles.expandChevron}
                  >
                    {item.expanded ? '􀆇' : '􀆈'}
                  </TextIcon>
                </SportsSurface>
                <Text color="labelTertiary" size="17pt" weight="bold">
                  {i18n.t(item.expanded ? i18n.l.sports.show_less : i18n.l.sports.show_more, { count: item.remaining })}
                </Text>
              </View>
            </ButtonPressAnimation>
          );
      }
    },
    [active, host, isDarkMode, onGamePress, route, visibleCarousels]
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0B0B0B' : '#FEFFFF' }]}>
      <FlatList
        ref={list}
        data={rows}
        keyExtractor={row => row.key}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY}
        initialNumToRender={8}
        windowSize={7}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: topInset + 24, paddingBottom: bottomInset + 80 }}
        scrollIndicatorInsets={{ top: topInset, bottom: bottomInset + 64 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<SportsRefreshControl host={host} />}
        ListHeaderComponent={
          <View style={[styles.header, view.query === null && view.destination.type === 'all' && styles.directoryHeader]}>
            {view.query !== null ? <SportsSearch host={host} /> : <SportsHeader host={host} />}
            {view.query !== null && <SportsDirectory host={host} />}
          </View>
        }
        ListFooterComponent={
          <>
            {view.query === null && <SportsDirectory host={host} />}
            <SportsReadStatus host={host} />
          </>
        }
      />
      <SportsScopeBar host={host} bottom={bottomInset + 12} />
    </View>
  );
}

function SectionHeading({ section, title, host }: { section: SportsSection; title: string; host: SportsHost }) {
  const { isDarkMode } = useColorMode();
  const scopeId = section.scopeId;
  return (
    <ButtonPressAnimation
      disabled={!scopeId}
      onPress={scopeId ? () => sportsActions.selectDestination(host, { type: 'scope', scopeId }) : undefined}
      scaleTo={0.98}
    >
      <View style={styles.heading}>
        {section.type === 'live' && !section.scopeId && (
          <View style={styles.liveIndicator}>
            <View style={[styles.liveRing, { borderColor: isDarkMode ? 'rgba(255,88,77,0.3)' : 'rgba(250,66,60,0.3)' }]}>
              <View style={[styles.liveDot, { backgroundColor: isDarkMode ? '#E65048' : '#FA423C' }]} />
            </View>
          </View>
        )}
        <Text color="label" size="22pt" weight="heavy">
          {title}
        </Text>
        <SportsSurface
          borderRadius={8}
          color={isDarkMode ? 'rgba(255,255,255,0.03)' : undefined}
          gradient={isDarkMode ? undefined : LIGHT_BADGE_GRADIENT}
          borderColor={isDarkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF'}
          borderWidth={4 / 3}
          shadows={isDarkMode ? undefined : LIGHT_BADGE_SHADOWS}
          style={styles.count}
        >
          <Text color="labelSecondary" size="14pt" weight="heavy">
            {section.gameIds.length}
          </Text>
        </SportsSurface>
        {section.scopeId && (
          <TextIcon
            color={{ custom: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
            size="15pt"
            weight="heavy"
            width={13}
            height={10}
          >
            {'􀯻'}
          </TextIcon>
        )}
      </View>
    </ButtonPressAnimation>
  );
}

function SportsRefreshControl({ host, children, style }: { host: SportsHost } & Pick<RefreshControlProps, 'children' | 'style'>) {
  const [refreshing, setRefreshing] = useState(false);
  const color = useForegroundColor('labelTertiary');
  return (
    <RefreshControl
      refreshing={refreshing}
      style={style}
      onRefresh={() => {
        setRefreshing(true);
        void sportsActions.refresh(host).finally(() => setRefreshing(false));
      }}
      tintColor={color}
      colors={[color]}
    >
      {children}
    </RefreshControl>
  );
}

function SportsReadStatus({ host }: { host: SportsHost }) {
  const status = useSportsStore(state => {
    const { request } = state.hosts[host];
    const result = getSportsResult(state, host);
    const directory =
      request.query === null &&
      (request.destination.type === 'all' ||
        (request.destination.type === 'scope' && hasCompetitionDirectory(state.catalog, request.destination.scopeId)));
    return {
      error: state.error,
      loading: state.getStatus('isLoading'),
      empty: result?.gameIds.length === 0 && !directory,
      nextCursor: result?.nextCursor,
      searching: request.query !== null,
      waitingForQuery: request.query === '',
      hasResult: Boolean(result),
    };
  }, deepEqual);
  const color = useForegroundColor('labelTertiary');
  if (status.waitingForQuery) return null;
  if (status.loading && !status.hasResult)
    return (
      <View style={styles.message}>
        <ActivityIndicator color={color} />
      </View>
    );
  return (
    <View style={styles.message}>
      {(status.error || status.empty) && (
        <Text align="center" color="labelTertiary" size="17pt" weight="bold">
          {i18n.t(status.error ? i18n.l.sports.error : status.searching ? i18n.l.sports.search_empty : i18n.l.sports.empty)}
        </Text>
      )}
      {(status.error || status.nextCursor) && (
        <ButtonPressAnimation
          disabled={status.loading}
          onPress={() => (status.error ? sportsActions.refresh(host) : sportsActions.loadMore(host))}
          scaleTo={0.96}
        >
          <Text color="accent" size="17pt" weight="bold">
            {i18n.t(status.error ? i18n.l.sports.retry : i18n.l.sports.load_more)}
          </Text>
        </ButtonPressAnimation>
      )}
    </View>
  );
}

const SECTION_LABELS = {
  live: i18n.l.sports.live,
  today: i18n.l.sports.today,
  upcoming: i18n.l.sports.upcoming,
  search: i18n.l.sports.search_results,
};
const VIEWABILITY = { itemVisiblePercentThreshold: 1 };
const LIGHT_BADGE_GRADIENT = ['rgba(255,255,255,0.54)', 'rgba(255,255,255,0.81)'] as const;
const LIGHT_BADGE_SHADOWS = [
  { color: 'rgba(0,0,0,0.06)', blur: 8, dx: 0, dy: 2, drawBehind: true },
  { color: 'rgba(0,0,0,0.02)', blur: 3, dx: 0, dy: 2 },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 8 },
  directoryHeader: { paddingBottom: 13 },
  card: { marginHorizontal: 12, marginBottom: 8 },
  heading: { height: 60, flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  count: { height: 23, paddingHorizontal: 7, justifyContent: 'center', alignItems: 'center' },
  liveIndicator: { width: 16, height: 16, marginRight: 10 },
  liveRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  expand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 12, paddingBottom: 4 },
  expandIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  expandChevron: { letterSpacing: 0.51 },
  message: { alignItems: 'center', gap: 20, padding: 28 },
});
