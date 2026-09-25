import { memo, useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { analytics } from '@/analytics';
import { event as analyticsEvent } from '@/analytics/event';
import { Skeleton } from '@/components/Skeleton';
import { useColorMode } from '@/design-system/color/ColorMode';
import { Text } from '@/design-system/components/Text/Text';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { ShowMoreButton } from '@/features/discover/components/markets/layouts/ShowMoreButton';
import { resolveSectionTitle } from '@/features/discover/components/SectionLayout';
import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { hasDestinationRoot, navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { trackDiscoverCardPress } from '@/features/discover/utils/trackDiscoverCardPress';
import {
  predictionCardEventsStore,
  predictionTileEventsStore,
  usePredictionEventsStore,
} from '@/features/placements/stores/derived/predictionsPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type SectionId, type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { PolymarketEventsListItem } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { type SportsCatalog } from '@/features/sports/core/catalog';
import { getGameId, useSportsStore } from '@/features/sports/data/sportsStore';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { useCleanup } from '@/hooks/useCleanup';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';

// ============ PredictionEventsSection ======================================== //

export function PredictionEventsSection({
  sectionId,
  surface,
  surfaceId,
}: {
  sectionId: SectionId;
  surface: SurfaceLeaf & { placement: string };
  surfaceId: SurfaceId;
}): ReactElement | null {
  const [expanded, setExpanded] = useState(false);
  const { width } = useDimensions();
  const { isDarkMode } = useColorMode();
  const catalog = useSportsStore(s => s.catalog);
  const openGame = useSportsGamePress();

  const placement = usePlacementsStore(state => state.getPlacement(surface.placement));
  const pending = useIsDiscoverSurfacePlacementPending(surface.placement);
  const eventIds = useMemo(() => {
    const ids = new Set<string>();
    if (placement?.source === 'polymarket') {
      for (const item of placement.items) ids.add(item.id);
    }
    return [...ids];
  }, [placement]);

  const carousel = surface.display === 'prediction_event_card.carousel';
  const renderedIds = useMemo(
    () => (!carousel && expanded ? eventIds : eventIds.slice(0, surface.limit)),
    [carousel, expanded, eventIds, surface.limit]
  );
  const cardWidth = width - (renderedIds.length === 1 ? 24 : 30);
  const title = resolveSectionTitle(surface);
  const destination = hasDestinationRoot(surface.destination, 'predictions') ? surface.destination : undefined;

  useEffect(() => discoverEventListsStore.getState().setList(sectionId, surface.id, renderedIds), [renderedIds, sectionId, surface.id]);
  useCleanup(() => discoverEventListsStore.getState().removeList(sectionId, surface.id), [sectionId, surface.id]);

  const recordPress = useCallback(
    (itemId: string, marketName: string, marketSlug?: string) => {
      if (!placement) return;
      trackDiscoverCardPress({
        placement,
        section: surface,
        surfaceId,
        title,
        itemId,
        itemOrder: eventIds.indexOf(itemId),
        metadata: { marketId: itemId, marketName, marketSlug },
      });
    },
    [eventIds, placement, surface, surfaceId, title]
  );

  const renderCard = useCallback(
    ({ item: eventId }: { item: string }) => {
      const card = (
        <PredictionEventCard
          key={eventId}
          catalog={catalog}
          isDarkMode={isDarkMode}
          eventId={eventId}
          width={carousel ? cardWidth : width - 24}
          onPress={recordPress}
          openGame={openGame}
        />
      );

      return carousel ? <View style={{ width: cardWidth }}>{card}</View> : card;
    },
    [cardWidth, carousel, catalog, isDarkMode, openGame, recordPress, width]
  );

  if (!eventIds.length && !pending) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        onPress={
          destination
            ? () => {
                analytics.track(analyticsEvent.discoverSectionPressed, {
                  destination,
                  display: surface.display,
                  sectionId: surface.id,
                  sectionTitle: title,
                });
                navigateDiscoverDestination(destination);
              }
            : undefined
        }
      />
      {pending && !eventIds.length ? (
        <View style={styles.list}>
          <Skeleton borderRadius={24} height={166} width="100%" />
        </View>
      ) : carousel ? (
        <FlatList
          horizontal
          data={renderedIds}
          renderItem={renderCard}
          keyExtractor={eventId => eventId}
          contentContainerStyle={styles.carousel}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + 8}
          decelerationRate="fast"
          initialNumToRender={3}
          windowSize={3}
        />
      ) : (
        <View style={styles.list}>
          {renderedIds.map(eventId => renderCard({ item: eventId }))}
          {!expanded && renderedIds.length < eventIds.length ? <ShowMoreButton onPress={() => setExpanded(true)} /> : null}
        </View>
      )}
    </View>
  );
}

// ============ Event Cards ==================================================== //

const PredictionEventCard = memo(function PredictionEventCard({
  catalog,
  isDarkMode,
  eventId,
  width,
  onPress,
  openGame,
}: {
  eventId: string;
  width: number;
  catalog?: SportsCatalog;
  isDarkMode: boolean;
  onPress: (eventId: string, marketName: string, marketSlug?: string) => void;
  openGame: SportsGamePress;
}): ReactElement {
  const gameId = useSportsStore(state => getGameId(state, eventId));

  if (gameId) {
    return (
      <GameCard
        catalog={catalog}
        isDarkMode={isDarkMode}
        gameId={gameId}
        width={width}
        onPress={(id, selection) => {
          const game = useSportsStore.getState().games[id];
          if (game) onPress(eventId, game.participants.map(participant => participant.name).join(' vs. '));
          openGame(id, selection);
        }}
      />
    );
  }

  if (gameId === null) return <PolymarketEventCard eventId={eventId} onPress={onPress} />;
  return <Skeleton borderRadius={24} height={166} width="100%" />;
});

function PolymarketEventCard({
  eventId,
  onPress,
}: {
  eventId: string;
  onPress: (eventId: string, marketName: string, marketSlug?: string) => void;
}): ReactElement {
  const event = usePredictionEventsStore(getEvent => getEvent(eventId));
  if (!event) return <PredictionEventPlaceholder eventId={eventId} />;

  return (
    <PolymarketEventsListItem
      event={event}
      onPress={() => {
        onPress(eventId, event.title, event.slug);
        navigateToPolymarketEvent({ eventId, event });
      }}
      shouldActivateOnStart={false}
      style={styles.genericCard}
    />
  );
}

function PredictionEventPlaceholder({ eventId }: { eventId: string }): ReactElement {
  const useEventStore = useDiscoverSurfacePlacementRefs(refs =>
    refs.polymarket.includes(eventId) ? predictionTileEventsStore : predictionCardEventsStore
  );
  const status = useEventStore(state => (state.getStatus('isInitialLoad') ? 'loading' : state.error));

  if (status === 'loading') return <Skeleton borderRadius={24} height={166} width="100%" />;

  return (
    <View style={styles.unavailable}>
      <Text color="labelTertiary" align="center" size="15pt" weight="bold">
        {i18n.t(status ? i18n.l.sports.event_error : i18n.l.sports.event_unavailable)}
      </Text>
    </View>
  );
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  section: { gap: 20 },
  list: { marginHorizontal: 12, gap: 8 },
  carousel: { paddingHorizontal: 12, gap: 8 },
  genericCard: { width: '100%', height: 166 },
  unavailable: { height: 166, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
