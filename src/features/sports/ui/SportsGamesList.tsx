import { useCallback, useImperativeHandle, useMemo, useRef, useState, type ReactElement, type Ref } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type ViewStyle,
  type ViewToken,
} from 'react-native';

import { useListen } from '@storesjs/stores';

import { useColorMode } from '@/design-system/color/ColorMode';
import { type SportsHost } from '@/features/sports/core/browse';
import { type SportsSection } from '@/features/sports/core/sections';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { sportsPageStores, type SportsPage } from '@/features/sports/data/sportsPageStore';
import { refreshSportsPage, useSportsStore } from '@/features/sports/data/sportsStore';
import { SPORTS_BACKGROUND_COLOR_DARK, SPORTS_BACKGROUND_COLOR_LIGHT } from '@/features/sports/ui/colors';
import { GameCard, GameCardPathsContext, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { GameCarousel } from '@/features/sports/ui/GameCarousel';
import { SportsCategoryBar } from '@/features/sports/ui/SportsCategoryBar';
import { SportsDirectoryHeading, SportsDirectoryRow } from '@/features/sports/ui/SportsDirectory';
import { SportsHeader } from '@/features/sports/ui/SportsHeader';
import { useSportsPriceSubscription } from '@/features/sports/ui/sportsPrices';
import { SportsReadStatus } from '@/features/sports/ui/SportsReadStatus';
import { SportsSearch } from '@/features/sports/ui/SportsSearch';
import { SportsSectionHeading, SportsSectionToggle } from '@/features/sports/ui/SportsSection';
import { useViewabilityTracker, type ViewabilitySelectors } from '@/framework/ui/hooks/useViewabilityTracker';
import useDimensions from '@/hooks/useDimensions';
import { useLazyRef } from '@/hooks/useLazyRef';

// ============ Types ========================================================== //

export type SportsGamesListHandle = { scrollToTop: () => void };

type Row =
  | { key: string; type: 'directory'; scopeId: string; competition: boolean; style?: ViewStyle }
  | { key: string; type: 'directory-heading'; showTitle: boolean }
  | { key: string; type: 'heading'; section: SportsSection }
  | { key: string; type: 'carousel'; section: SportsSection }
  | { key: string; type: 'game'; gameId: string; scopeId?: string }
  | { key: string; type: 'expand'; sectionKey: string; remaining: number; expanded: boolean };

// ============ Constants ====================================================== //

const COLLAPSED_GAME_COUNT = 2;
const EMPTY_EXPANDED_SET = new Set<string>();
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 1 };
const VIEWABILITY_SELECTORS: ViewabilitySelectors<ViewToken<Row>> = {
  getId: ({ item }) => (item.type === 'game' ? item.gameId : undefined),
  getChildKey: ({ item, key }) => (item.type === 'carousel' ? key : undefined),
};

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
  const { width } = useDimensions();
  const { isDarkMode, foregroundColors } = useColorMode();

  const [expanded, setExpanded] = useState(() => EMPTY_EXPANDED_SET);
  const { page, scope, parent, back, selectedCategory, categories, directoryIds, sections } = sportsPageStores[host]();
  const catalog = useSportsStore(s => s.catalog);

  const listRef = useRef<FlatList<Row>>(null);
  const cardPathsRef = useLazyRef(() => new Map<string, string>());

  const isSearching = page === 'search';
  const rows = useMemo(() => buildRows(sections, page, expanded, scope?.id, directoryIds), [directoryIds, sections, expanded, page, scope]);
  const setVisibleGames = useSportsPriceSubscription();
  const { onViewableItemsChanged, onChildViewableItemsChanged: onCarouselVisibleGamesChanged } = useViewabilityTracker(
    VIEWABILITY_SELECTORS,
    setVisibleGames
  );

  const toggleSection = useCallback((sectionKey: string) => {
    setExpanded(previous => {
      const next = new Set(previous);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  }, []);

  useImperativeHandle(ref, () => ({ scrollToTop: () => listRef.current?.scrollToOffset({ offset: 0, animated: true }) }), []);

  useListen(
    sportsNavigationStores[host],
    state => state,
    () => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      setExpanded(EMPTY_EXPANDED_SET);
    },
    { equalityFn: (previous, next) => previous.destination === next.destination && previous.query === next.query }
  );

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      switch (item.type) {
        case 'directory': {
          const directoryScope = catalog?.scopes[item.scopeId];
          return directoryScope ? (
            <SportsDirectoryRow
              scope={directoryScope}
              host={host}
              competition={item.competition}
              isDarkMode={isDarkMode}
              style={item.style}
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
              rowKey={item.key}
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
              onPress={() => toggleSection(item.sectionKey)}
            />
          );
      }
    },
    [catalog, host, isDarkMode, onCarouselVisibleGamesChanged, onGamePress, toggleSection, width]
  );

  return (
    <GameCardPathsContext value={cardPathsRef.current}>
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
                page === 'sports' ? styles.directoryHeader : undefined,
              ]}
            >
              {isSearching ? (
                <SportsSearch host={host} color={foregroundColors.label} backgroundColor={foregroundColors.fillQuaternary} />
              ) : (
                <SportsHeader host={host} isDarkMode={isDarkMode} page={page} scope={scope} parent={parent} back={back} />
              )}
            </View>
          }
          ListFooterComponent={<SportsReadStatus host={host} isDarkMode={isDarkMode} width={width} page={page} />}
          ListFooterComponentStyle={sections.length === 0 ? styles.footer : undefined}
        />

        {isSearching ? null : (
          <SportsCategoryBar
            categories={categories}
            selectedCategory={selectedCategory}
            isDarkMode={isDarkMode}
            width={width}
            catalog={catalog}
            host={host}
            bottom={bottomInset + 20}
          />
        )}
      </View>
    </GameCardPathsContext>
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
        void refreshSportsPage(host).finally(() => setRefreshing(false));
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
    for (const scopeId of directoryIds) {
      rows.push({
        key: `directory:${scopeId}`,
        type: 'directory',
        scopeId,
        competition: false,
        style: scopeId === directoryIds[directoryIds.length - 1] ? styles.searchDirectoryEnd : undefined,
      });
    }
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
    for (const scopeId of directoryIds) {
      rows.push({ key: `directory:${scopeId}`, type: 'directory', scopeId, competition: page === 'competitions' });
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
  searchDirectoryEnd: { marginBottom: 8 },
  card: { marginHorizontal: 12, marginBottom: 8 },
});
