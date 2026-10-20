import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View, type ViewToken } from 'react-native';

import { FlatList as GestureHandlerFlatList, type NativeViewGestureHandlerProps } from 'react-native-gesture-handler';

import { type SportsCatalog } from '@/features/sports/core/catalog';
import { type SportsSection } from '@/features/sports/core/sections';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { useCleanup } from '@/hooks/useCleanup';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 1 };

/**
 * A snapping carousel of game cards.
 */
export const GameCarousel = memo(function GameCarousel({
  blocksHandlers,
  section,
  catalog,
  currentDay,
  width,
  isDarkMode,
  rowKey,
  onVisibleGamesChanged,
  onGamePress,
}: {
  /** Gestures that should wait for the carousel's scroll gesture to fail. */
  blocksHandlers?: NativeViewGestureHandlerProps['blocksHandlers'];
  section: SportsSection;
  catalog?: SportsCatalog;
  currentDay: string;
  width: number;
  isDarkMode: boolean;
  rowKey: string;
  onVisibleGamesChanged: (rowKey: string, items: readonly ViewToken<string>[]) => void;
  onGamePress: SportsGamePress;
}) {
  const List = blocksHandlers ? GestureHandlerFlatList : FlatList;
  const cardWidth = width - (section.gameIds.length === 1 ? 24 : 30);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<string>[] }) => onVisibleGamesChanged(rowKey, viewableItems),
    [onVisibleGamesChanged, rowKey]
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={{ width: cardWidth }}>
        <GameCard
          catalog={catalog}
          currentDay={currentDay}
          isDarkMode={isDarkMode}
          gameId={item}
          scopeId={section.scopeId}
          width={cardWidth}
          onPress={onGamePress}
        />
      </View>
    ),
    [cardWidth, catalog, currentDay, isDarkMode, onGamePress, section.scopeId]
  );

  useCleanup(() => onVisibleGamesChanged(rowKey, []));

  return (
    <List
      blocksHandlers={blocksHandlers}
      horizontal
      data={section.gameIds}
      renderItem={renderItem}
      keyExtractor={gameId => gameId}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={VIEWABILITY_CONFIG}
      style={styles.list}
      contentContainerStyle={styles.content}
      snapToInterval={cardWidth + 8}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      initialNumToRender={3}
      windowSize={3}
    />
  );
});

const styles = StyleSheet.create({
  list: { overflow: 'visible' },
  content: { gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
});
