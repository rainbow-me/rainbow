import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type ViewToken,
} from 'react-native';

import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { type SportsHost } from '@/features/sports/core/browse';
import { type SportsSection } from '@/features/sports/core/sections';
import { sportsBrowseStores } from '@/features/sports/data/sportsBrowse';
import { getSportsResult, sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { GameCarousel } from '@/features/sports/ui/GameCarousel';
import { SportsDirectory } from '@/features/sports/ui/SportsDirectory';
import { SportsHeader, SportsScopeBar } from '@/features/sports/ui/SportsNavigation';
import { SportsReadStatus } from '@/features/sports/ui/SportsReadStatus';
import { SportsSearch } from '@/features/sports/ui/SportsSearch';
import { SportsSectionHeading, SportsSectionToggle } from '@/features/sports/ui/SportsSection';
import { useSportsHost } from '@/features/sports/ui/useSportsHost';
import { useSportsQuotes } from '@/features/sports/ui/useSportsQuotes';
import useDimensions from '@/hooks/useDimensions';
import { type Route } from '@/navigation/routesNames';

export type SportsBrowseHandle = { scrollToTop: () => void };

const EMPTY_SECTIONS: SportsSection[] = [];

type Row =
  | { key: string; type: 'heading'; section: SportsSection }
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
  useSportsHost(host, visible);
  const { width } = useDimensions();
  const { isDarkMode } = useColorMode();
  const list = useRef<FlatList<Row>>(null);
  const [expanded, setExpanded] = useState(new Set<string>());
  const viewport = useRef<{ gameIds: string[]; carouselKeys: string[] }>({ gameIds: [], carouselKeys: [] });
  const carouselGames = useRef(new Map<string, string[]>());
  const layout = sportsBrowseStores[host](state => state.layout);
  const request = useSportsViewStore(state => state.hosts[host].request);
  const sections = useSportsStore(state => getSportsResult(state, request)?.sections ?? EMPTY_SECTIONS);
  const { destination, query } = request;

  const rows = useMemo(() => {
    const rows: Row[] = [];
    for (const section of sections) {
      const key = section.scopeId ?? section.type;
      rows.push({ key: `heading:${key}`, type: 'heading', section });
      if (layout === 'live') {
        rows.push({ key: `carousel:${key}`, type: 'carousel', section });
        continue;
      }
      const count = query !== null || expanded.has(key) ? section.gameIds.length : 2;
      for (const gameId of section.gameIds.slice(0, count))
        rows.push({
          key: `game:${gameId}`,
          type: 'game',
          gameId,
          scopeId: destination.type === 'scope' ? destination.scopeId : section.scopeId,
        });
      if (query === null && section.gameIds.length > 2)
        rows.push({
          key: `expand:${key}`,
          type: 'expand',
          sectionKey: key,
          remaining: section.gameIds.length - 2,
          expanded: expanded.has(key),
        });
    }
    return rows;
  }, [destination, query, sections, expanded, layout]);

  const renderedGameIds = useMemo(
    () => rows.flatMap(row => (row.type === 'game' ? [row.gameId] : row.type === 'carousel' ? row.section.gameIds : [])),
    [rows]
  );
  const setVisibleGames = useSportsQuotes(route, visible, renderedGameIds);
  const updateVisibleGames = useCallback(() => {
    const { gameIds, carouselKeys } = viewport.current;
    setVisibleGames([...gameIds, ...carouselKeys.flatMap(key => carouselGames.current.get(key) ?? [])]);
  }, [setVisibleGames]);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Row>[] }) => {
      viewport.current = {
        gameIds: viewableItems.flatMap(({ item }) => (item.type === 'game' ? [item.gameId] : [])),
        carouselKeys: viewableItems.flatMap(({ item }) => (item.type === 'carousel' ? [item.key] : [])),
      };
      updateVisibleGames();
    },
    [updateVisibleGames]
  );
  const onCarouselVisibleGamesChanged = useCallback(
    (sectionKey: string, gameIds: string[]) => {
      if (gameIds.length) carouselGames.current.set(sectionKey, gameIds);
      else carouselGames.current.delete(sectionKey);
      updateVisibleGames();
    },
    [updateVisibleGames]
  );

  useImperativeHandle(ref, () => ({ scrollToTop: () => list.current?.scrollToOffset({ offset: 0, animated: true }) }), []);
  useEffect(() => {
    list.current?.scrollToOffset({ offset: 0, animated: false });
    setExpanded(new Set());
  }, [destination, query]);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      switch (item.type) {
        case 'game':
          return (
            <View style={styles.card}>
              <GameCard gameId={item.gameId} scopeId={item.scopeId} width={width - 24} onPress={onGamePress} />
            </View>
          );
        case 'heading':
          return <SportsSectionHeading section={item.section} host={host} />;
        case 'carousel':
          return (
            <GameCarousel
              section={item.section}
              sectionKey={item.key}
              onVisibleGamesChanged={onCarouselVisibleGamesChanged}
              onGamePress={onGamePress}
            />
          );
        case 'expand':
          return (
            <SportsSectionToggle
              expanded={item.expanded}
              remaining={item.remaining}
              onPress={() =>
                setExpanded(previous => {
                  const next = new Set(previous);
                  if (next.has(item.sectionKey)) next.delete(item.sectionKey);
                  else next.add(item.sectionKey);
                  return next;
                })
              }
            />
          );
      }
    },
    [host, onCarouselVisibleGamesChanged, onGamePress, width]
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
        contentContainerStyle={[styles.content, { paddingTop: topInset + 24, paddingBottom: bottomInset + 80 }]}
        scrollIndicatorInsets={{ top: topInset, bottom: bottomInset + 64 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<SportsRefreshControl host={host} />}
        ListHeaderComponent={
          <View style={[styles.header, query === null && destination.type === 'all' && styles.directoryHeader]}>
            {query !== null ? <SportsSearch host={host} /> : <SportsHeader host={host} />}
            {query !== null && <SportsDirectory host={host} />}
          </View>
        }
        ListFooterComponent={
          <>
            {query === null && <SportsDirectory host={host} showHeading={sections.length > 0} />}
            <SportsReadStatus host={host} />
          </>
        }
        ListFooterComponentStyle={rows.length === 0 && styles.footer}
      />
      <SportsScopeBar host={host} bottom={bottomInset + 20} />
    </View>
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

const VIEWABILITY = { itemVisiblePercentThreshold: 1 };

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1 },
  footer: { flexGrow: 1 },
  header: { paddingBottom: 8 },
  directoryHeader: { paddingBottom: 13 },
  card: { marginHorizontal: 12, marginBottom: 8 },
});
