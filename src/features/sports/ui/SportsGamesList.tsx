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
import { type SportsHost } from '@/features/sports/core/browse';
import { type SportsSection } from '@/features/sports/core/sections';
import { sportsNavigationStores, type SportsPage } from '@/features/sports/data/sportsNavigation';
import { getSportsResult, sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { SPORTS_BACKGROUND_COLOR_DARK, SPORTS_BACKGROUND_COLOR_LIGHT } from '@/features/sports/ui/colors';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { GameCarousel } from '@/features/sports/ui/GameCarousel';
import { SportsCategoryBar } from '@/features/sports/ui/SportsCategoryBar';
import { SportsDirectoryHeading, SportsDirectoryRow } from '@/features/sports/ui/SportsDirectory';
import { SportsHeader } from '@/features/sports/ui/SportsHeader';
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
  | { key: string; type: 'directory'; scopeId: string }
  | { key: string; type: 'directory-heading'; showTitle: boolean }
  | { key: string; type: 'heading'; section: SportsSection }
  | { key: string; type: 'carousel'; section: SportsSection }
  | { key: string; type: 'game'; gameId: string; scopeId?: string }
  | { key: string; type: 'expand'; sectionKey: string; remaining: number; expanded: boolean };

// ============ Constants ====================================================== //

const COLLAPSED_GAME_COUNT = 2;
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
  const { isDarkMode, foregroundColors } = useColorMode();

  const [expanded, setExpanded] = useState(() => new Set<string>());
  const request = useSportsViewStore(s => s.hosts[host].request);
  const sections = useSportsStore(s => getSportsResult(s, request)?.sections ?? EMPTY_SECTIONS);
  const catalog = useSportsStore(s => s.catalog);
  const counts = useSportsStore(s => s.counts);
  const navigation = sportsNavigationStores[host]();
  const { page, directoryIds } = navigation;

  const listRef = useRef<FlatList<Row>>(null);
  const viewportRef = useLazyRef<{ gameIds: string[]; carouselKeys: string[] }>(() => ({ gameIds: [], carouselKeys: [] }));
  const carouselGamesRef = useLazyRef(() => new Map<string, string[]>());

  const destination = request.destination;
  const isSearching = page === 'search';

  const rows = useMemo(
    () => buildRows(sections, page, expanded, destination.type === 'scope' ? destination.scopeId : undefined, directoryIds),
    [destination, directoryIds, sections, expanded, page]
  );

  const renderedGameIds = useMemo(() => {
    const gameIds: string[] = [];
    for (const row of rows) {
      if (row.type === 'game') gameIds.push(row.gameId);
      else if (row.type === 'carousel') gameIds.push(...row.section.gameIds);
    }
    return gameIds;
  }, [rows]);

  const setVisibleGames = useSportsQuotes(renderedGameIds);

  const updateVisibleGames = useCallback(() => {
    const { gameIds, carouselKeys } = viewportRef.current;
    if (!carouselKeys.length) return setVisibleGames(gameIds);

    const visibleGameIds = [...gameIds];
    for (const key of carouselKeys) {
      const carouselGameIds = carouselGamesRef.current.get(key);
      if (carouselGameIds) visibleGameIds.push(...carouselGameIds);
    }
    setVisibleGames(visibleGameIds);
  }, [carouselGamesRef, setVisibleGames, viewportRef]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Row>[] }) => {
      const gameIds: string[] = [];
      const carouselKeys: string[] = [];
      for (const { item } of viewableItems) {
        if (item.type === 'game') gameIds.push(item.gameId);
        else if (item.type === 'carousel') carouselKeys.push(item.key);
      }
      viewportRef.current = { gameIds, carouselKeys };
      updateVisibleGames();
    },
    [updateVisibleGames, viewportRef]
  );

  const onCarouselVisibleGamesChanged = useCallback(
    (sectionKey: string, gameIds: string[]) => {
      if (gameIds.length) carouselGamesRef.current.set(sectionKey, gameIds);
      else carouselGamesRef.current.delete(sectionKey);
      if (viewportRef.current.carouselKeys.includes(sectionKey)) updateVisibleGames();
    },
    [carouselGamesRef, updateVisibleGames, viewportRef]
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
        case 'directory': {
          const scope = catalog?.scopes[item.scopeId];
          return scope ? (
            <SportsDirectoryRow
              scope={scope}
              count={counts[item.scopeId] ?? 0}
              host={host}
              competition={page === 'competitions'}
              isDarkMode={isDarkMode}
              style={isSearching && item.scopeId === directoryIds[directoryIds.length - 1] ? styles.searchDirectoryEnd : undefined}
            />
          ) : null;
        }
        case 'directory-heading':
          return <SportsDirectoryHeading showTitle={item.showTitle} isDarkMode={isDarkMode} />;
        case 'game':
          return (
            <GameCard
              catalog={catalog}
              isDarkMode={isDarkMode}
              gameId={item.gameId}
              scopeId={item.scopeId}
              width={width - 24}
              onPress={onGamePress}
              style={styles.card}
            />
          );
        case 'heading':
          return (
            <SportsSectionHeading
              section={item.section}
              host={host}
              isDarkMode={isDarkMode}
              scope={item.section.scopeId ? catalog?.scopes[item.section.scopeId] : undefined}
            />
          );
        case 'carousel':
          return (
            <GameCarousel
              catalog={catalog}
              width={width}
              isDarkMode={isDarkMode}
              section={item.section}
              sectionKey={item.key}
              onVisibleGamesChanged={onCarouselVisibleGamesChanged}
              onGamePress={onGamePress}
            />
          );
        case 'expand':
          return (
            <SportsSectionToggle
              isDarkMode={isDarkMode}
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
    [catalog, counts, directoryIds, host, isDarkMode, isSearching, onCarouselVisibleGamesChanged, onGamePress, page, width]
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
        refreshControl={<SportsRefreshControl host={host} color={foregroundColors.labelTertiary} />}
        ListHeaderComponent={
          <View
            style={[
              isSearching && directoryIds.length ? undefined : styles.header,
              !isSearching && destination.type === 'all' ? styles.directoryHeader : undefined,
            ]}
          >
            {!isSearching ? (
              <SportsHeader host={host} isDarkMode={isDarkMode} navigation={navigation} />
            ) : (
              <SportsSearch host={host} color={foregroundColors.label} backgroundColor={foregroundColors.fillQuaternary} />
            )}
          </View>
        }
        ListFooterComponent={<SportsReadStatus host={host} isDarkMode={isDarkMode} width={width} page={page} />}
        ListFooterComponentStyle={sections.length === 0 ? styles.footer : undefined}
      />

      {isSearching ? null : (
        <SportsCategoryBar
          navigation={navigation}
          isDarkMode={isDarkMode}
          width={width}
          catalog={catalog}
          host={host}
          bottom={bottomInset + 20}
        />
      )}
    </View>
  );
}

function SportsRefreshControl({
  host,
  color,
  children,
  style,
}: { host: SportsHost; color: string } & Pick<RefreshControlProps, 'children' | 'style'>): ReactElement {
  const [refreshing, setRefreshing] = useState(false);

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
  page: SportsPage,
  expanded: ReadonlySet<string>,
  destinationScopeId: string | undefined,
  directoryIds: string[]
): Row[] {
  const rows: Row[] = [];
  const isSearching = page === 'search';

  if (isSearching) {
    for (const scopeId of directoryIds) rows.push({ key: `directory:${scopeId}`, type: 'directory', scopeId });
  }

  for (const section of sections) {
    const key = section.scopeId ?? section.type;
    rows.push({ key: `heading:${key}`, type: 'heading', section });

    if (page === 'live') {
      rows.push({ key: `carousel:${key}`, type: 'carousel', section });
      continue;
    }

    const count = isSearching || expanded.has(key) ? section.gameIds.length : Math.min(section.gameIds.length, COLLAPSED_GAME_COUNT);

    for (let index = 0; index < count; index++) {
      const gameId = section.gameIds[index];
      rows.push({
        key: `game:${gameId}`,
        type: 'game',
        gameId,
        scopeId: destinationScopeId ?? section.scopeId,
      });
    }

    if (!isSearching && section.gameIds.length > COLLAPSED_GAME_COUNT) {
      rows.push({
        key: `expand:${key}`,
        type: 'expand',
        sectionKey: key,
        remaining: section.gameIds.length - COLLAPSED_GAME_COUNT,
        expanded: expanded.has(key),
      });
    }
  }

  if (!isSearching && directoryIds.length) {
    if (page === 'competitions') rows.push({ key: 'directory-heading', type: 'directory-heading', showTitle: sections.length > 0 });
    for (const scopeId of directoryIds) rows.push({ key: `directory:${scopeId}`, type: 'directory', scopeId });
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
  searchDirectoryEnd: { marginBottom: 8 },
  card: { marginHorizontal: 12, marginBottom: 8 },
});
