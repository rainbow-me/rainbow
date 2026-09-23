import { useCallback, useImperativeHandle, useMemo, useRef, useState, type ReactElement, type Ref } from 'react';
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

import { shallowEqual, useListen } from '@storesjs/stores';

import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { type SportsHost } from '@/features/sports/core/browse';
import { type SportsSection } from '@/features/sports/core/sections';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigation';
import { getSportsResult, sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { SPORTS_BACKGROUND_COLOR_DARK, SPORTS_BACKGROUND_COLOR_LIGHT } from '@/features/sports/ui/colors';
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
import { useLazyRef } from '@/hooks/useLazyRef';

// ============ Types ========================================================== //

export type SportsGamesListHandle = { scrollToTop: () => void };

type Row =
  | { key: string; type: 'heading'; section: SportsSection }
  | { key: string; type: 'carousel'; section: SportsSection }
  | { key: string; type: 'game'; gameId: string; scopeId?: string }
  | { key: string; type: 'expand'; sectionKey: string; remaining: number; expanded: boolean };

// ============ Constants ====================================================== //

const EMPTY_SECTIONS: SportsSection[] = [];
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 1 };

// ============ Components ===================================================== //

export function SportsGamesList({
  host,
  topInset = 0,
  bottomInset,
  onGamePress,
  onScroll,
  ref,
}: {
  host: SportsHost;
  topInset?: number;
  bottomInset: number;
  onGamePress: SportsGamePress;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  ref?: Ref<SportsGamesListHandle>;
}): ReactElement {
  useSportsHost(host);
  const { width } = useDimensions();
  const { isDarkMode } = useColorMode();

  const [expanded, setExpanded] = useState(() => new Set<string>());
  const request = useSportsViewStore(s => s.hosts[host].request);
  const sections = useSportsStore(s => getSportsResult(s, request)?.sections ?? EMPTY_SECTIONS);
  const page = sportsNavigationStores[host](s => s.page);

  const listRef = useRef<FlatList<Row>>(null);
  const viewportRef = useLazyRef<{ gameIds: string[]; carouselKeys: string[] }>(() => ({ gameIds: [], carouselKeys: [] }));
  const carouselGamesRef = useLazyRef(() => new Map<string, string[]>());

  const destination = request.destination;
  const isSearching = !(request.query === null);

  const rows = useMemo(
    () => buildRows(sections, page, isSearching, expanded, destination.type === 'scope' ? destination.scopeId : undefined),
    [destination, isSearching, sections, expanded, page]
  );

  const renderedGameIds = useMemo(
    () => rows.flatMap(row => (row.type === 'game' ? [row.gameId] : row.type === 'carousel' ? row.section.gameIds : [])),
    [rows]
  );

  const setVisibleGames = useSportsQuotes(renderedGameIds);

  const updateVisibleGames = useCallback(() => {
    const { gameIds, carouselKeys } = viewportRef.current;
    setVisibleGames([...gameIds, ...carouselKeys.flatMap(key => carouselGamesRef.current.get(key) ?? [])]);
  }, [carouselGamesRef, setVisibleGames, viewportRef]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Row>[] }) => {
      viewportRef.current = {
        gameIds: viewableItems.flatMap(({ item }) => (item.type === 'game' ? [item.gameId] : [])),
        carouselKeys: viewableItems.flatMap(({ item }) => (item.type === 'carousel' ? [item.key] : [])),
      };
      updateVisibleGames();
    },
    [updateVisibleGames, viewportRef]
  );

  const onCarouselVisibleGamesChanged = useCallback(
    (sectionKey: string, gameIds: string[]) => {
      if (gameIds.length) carouselGamesRef.current.set(sectionKey, gameIds);
      else carouselGamesRef.current.delete(sectionKey);
      updateVisibleGames();
    },
    [carouselGamesRef, updateVisibleGames]
  );

  useImperativeHandle(ref, () => ({ scrollToTop: () => listRef.current?.scrollToOffset({ offset: 0, animated: true }) }), []);

  useListen(
    useSportsViewStore,
    s => s.hosts[host].request,
    () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      setExpanded(new Set());
    },
    { equalityFn: shallowEqual }
  );

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      switch (item.type) {
        case 'game':
          return <GameCard gameId={item.gameId} scopeId={item.scopeId} width={width - 24} onPress={onGamePress} style={styles.card} />;
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
    <View style={[styles.container, { backgroundColor: isDarkMode ? SPORTS_BACKGROUND_COLOR_DARK : SPORTS_BACKGROUND_COLOR_LIGHT }]}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={row => row.key}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        initialNumToRender={8}
        windowSize={3}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: topInset + 24, paddingBottom: bottomInset + 80 }]}
        scrollIndicatorInsets={{ top: topInset, bottom: bottomInset + 64 }}
        onScroll={onScroll}
        refreshControl={<SportsRefreshControl host={host} />}
        ListHeaderComponent={
          <View style={[styles.header, !isSearching && destination.type === 'all' ? styles.directoryHeader : undefined]}>
            {!isSearching ? <SportsHeader host={host} /> : <SportsSearch host={host} />}
            {!isSearching ? null : <SportsDirectory host={host} />}
          </View>
        }
        ListFooterComponent={
          <>
            {!isSearching ? <SportsDirectory host={host} showHeading={sections.length > 0} /> : null}
            <SportsReadStatus host={host} />
          </>
        }
        ListFooterComponentStyle={rows.length === 0 ? styles.footer : undefined}
      />

      <SportsScopeBar host={host} bottom={bottomInset + 20} />
    </View>
  );
}

function SportsRefreshControl({
  host,
  children,
  style,
}: { host: SportsHost } & Pick<RefreshControlProps, 'children' | 'style'>): ReactElement {
  const [refreshing, setRefreshing] = useState(false);
  const color = useForegroundColor('labelTertiary');

  return (
    <RefreshControl
      colors={[color]}
      onRefresh={() => {
        setRefreshing(true);
        void sportsActions.refresh(host).finally(() => setRefreshing(false));
      }}
      refreshing={refreshing}
      style={style}
      tintColor={color}
    >
      {children}
    </RefreshControl>
  );
}

// ============ Helpers ======================================================== //

function buildRows(
  sections: SportsSection[],
  page: string,
  isSearching: boolean,
  expanded: ReadonlySet<string>,
  destinationScopeId: string | undefined
): Row[] {
  const rows: Row[] = [];

  for (const section of sections) {
    const key = section.scopeId ?? section.type;
    rows.push({ key: `heading:${key}`, type: 'heading', section });

    if (page === 'live') {
      rows.push({ key: `carousel:${key}`, type: 'carousel', section });
      continue;
    }

    const count = isSearching || expanded.has(key) ? section.gameIds.length : 2;

    for (const gameId of section.gameIds.slice(0, count)) {
      rows.push({
        key: `game:${gameId}`,
        type: 'game',
        gameId,
        scopeId: destinationScopeId ?? section.scopeId,
      });
    }

    if (!isSearching && section.gameIds.length > 2) {
      rows.push({
        key: `expand:${key}`,
        type: 'expand',
        sectionKey: key,
        remaining: section.gameIds.length - 2,
        expanded: expanded.has(key),
      });
    }
  }

  return rows;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1 },
  footer: { flexGrow: 1 },
  header: { paddingBottom: 8 },
  directoryHeader: { paddingBottom: 13 },
  card: { marginHorizontal: 12, marginBottom: 8 },
});
