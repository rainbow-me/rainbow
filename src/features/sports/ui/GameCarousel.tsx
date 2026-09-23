import { memo, useCallback, type ReactElement } from 'react';
import { FlatList, StyleSheet, View, type ViewToken } from 'react-native';

import { type SportsCatalog } from '@/features/sports/core/catalog';
import { type SportsSection } from '@/features/sports/core/sections';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { useCleanup } from '@/hooks/useCleanup';

export const GameCarousel = memo(function GameCarousel({
  section,
  catalog,
  width,
  isDarkMode,
  sectionKey,
  onVisibleGamesChanged,
  onGamePress,
}: {
  section: SportsSection;
  catalog?: SportsCatalog;
  width: number;
  isDarkMode: boolean;
  sectionKey: string;
  onVisibleGamesChanged: (sectionKey: string, gameIds: string[]) => void;
  onGamePress: SportsGamePress;
}): ReactElement {
  const cardWidth = width - (section.gameIds.length === 1 ? 24 : 30);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<string>[] }) =>
      onVisibleGamesChanged(
        sectionKey,
        viewableItems.map(({ item }) => item)
      ),
    [onVisibleGamesChanged, sectionKey]
  );
  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={{ width: cardWidth }}>
        <GameCard
          catalog={catalog}
          isDarkMode={isDarkMode}
          gameId={item}
          scopeId={section.scopeId}
          width={cardWidth}
          onPress={onGamePress}
        />
      </View>
    ),
    [cardWidth, catalog, isDarkMode, onGamePress, section.scopeId]
  );

  useCleanup(() => onVisibleGamesChanged(sectionKey, []), [onVisibleGamesChanged, sectionKey]);

  return (
    <FlatList
      horizontal
      data={section.gameIds}
      renderItem={renderItem}
      keyExtractor={gameId => gameId}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={VIEWABILITY}
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

const VIEWABILITY = { itemVisiblePercentThreshold: 1 };
const styles = StyleSheet.create({
  list: { overflow: 'visible' },
  content: { gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
});
