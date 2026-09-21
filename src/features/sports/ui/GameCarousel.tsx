import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View, type ViewToken } from 'react-native';

import { type SportsSection } from '@/features/sports/core/sections';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { useSportsQuotes } from '@/features/sports/ui/useSportsQuotes';
import useDimensions from '@/hooks/useDimensions';
import { type Route } from '@/navigation/routesNames';

export const GameCarousel = memo(function GameCarousel({
  section,
  route,
  visible,
  onGamePress,
}: {
  section: SportsSection;
  route: Route;
  visible: boolean;
  onGamePress: SportsGamePress;
}) {
  const { width } = useDimensions();
  const cardWidth = width - (section.gameIds.length === 1 ? 24 : 30);
  const setVisibleGames = useSportsQuotes(route, visible, section.gameIds);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<string>[] }) => setVisibleGames(viewableItems.map(({ item }) => item)),
    [setVisibleGames]
  );
  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={{ width: cardWidth }}>
        <GameCard gameId={item} scopeId={section.scopeId} onPress={onGamePress} />
      </View>
    ),
    [cardWidth, onGamePress, section.scopeId]
  );

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
