import { memo, useCallback, useContext, useEffect, useMemo, useState, type ReactElement } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { analytics } from '@/analytics';
import { event as analyticsEvent } from '@/analytics/event';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Skeleton } from '@/components/Skeleton';
import { useColorMode } from '@/design-system/color/ColorMode';
import { Text } from '@/design-system/components/Text/Text';
import { DiscoverSectionDisplayedContext } from '@/features/discover/components/DiscoverSectionDisplayedContext';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { ShowMoreButton } from '@/features/discover/components/markets/layouts/ShowMoreButton';
import { resolveSectionTitle } from '@/features/discover/components/SectionLayout';
import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { hasDestinationRoot, navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { trackPlacementInteraction } from '@/features/placements/engagement/trackInteraction';
import { usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';
import { type SectionId, type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import {
  getPolymarketEventsListTokenIds,
  PolymarketEventsListItem,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { type SportsCatalog } from '@/features/sports/core/catalog';
import { getGameId, useSportsStore } from '@/features/sports/data/sportsStore';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { useSportsPriceSubscription } from '@/features/sports/ui/sportsPrices';
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
  const placement = usePlacementsStore(state => state.getPlacement(surface.placement));
  const eventIds = useMemo(() => {
    const ids = new Set<string>();
    if (placement?.source === 'polymarket') {
      for (const item of placement.items) ids.add(item.id);
    }
    return [...ids];
  }, [placement]);
  const pending = useIsDiscoverSurfacePlacementPending(surface.placement);
  const [expanded, setExpanded] = useState(false);
  const { width } = useDimensions();
  const { isDarkMode } = useColorMode();
  const catalog = useSportsStore(s => s.catalog);
  const carousel = surface.display === 'prediction_event_card.carousel';
  const renderedIds = useMemo(
    () => (!carousel && expanded ? eventIds : eventIds.slice(0, surface.limit)),
    [carousel, expanded, eventIds, surface.limit]
  );
  const displayed = useContext(DiscoverSectionDisplayedContext);
  const cardWidth = width - (renderedIds.length === 1 ? 24 : 30);
  const title = resolveSectionTitle(surface);
  const openGame = useSportsGamePress();

  useEffect(() => discoverEventListsStore.getState().setList(sectionId, surface.id, renderedIds), [renderedIds, sectionId, surface.id]);
  useCleanup(() => discoverEventListsStore.getState().removeList(sectionId, surface.id), [sectionId, surface.id]);

  const recordPress = useCallback(
    (itemId: string, marketName: string, marketSlug?: string) => {
      if (!placement) return;
      const itemOrder = eventIds.indexOf(itemId);
      analytics.track(analyticsEvent.discoverCardPressed, {
        placementId: placement.id,
        placementSource: placement.source,
        placementTitle: title,
        itemOrder,
        itemId,
        marketId: itemId,
        marketName,
        marketSlug,
        marketType: placement.type,
      });
      trackPlacementInteraction({
        display: surface.display,
        id: placement.id,
        interactionType: 'card_press',
        itemId,
        itemOrder,
        sectionId: surface.id,
        sectionTitle: title,
        source: placement.source,
        surfaceId,
        type: placement.type,
        version: placement.version,
      });
    },
    [eventIds, placement, surface.display, surface.id, surfaceId, title]
  );

  const renderCard = useCallback(
    ({ item: eventId }: { item: string }) => (
      <View key={eventId} style={carousel ? { width: cardWidth } : undefined}>
        <PredictionEventCard
          catalog={catalog}
          isDarkMode={isDarkMode}
          eventId={eventId}
          width={carousel ? cardWidth : width - 24}
          onPress={recordPress}
          openGame={openGame}
        />
      </View>
    ),
    [cardWidth, carousel, catalog, isDarkMode, openGame, recordPress, width]
  );

  if (!eventIds.length && !pending) return null;

  const destination = hasDestinationRoot(surface.destination, 'predictions') ? surface.destination : undefined;

  return (
    <View style={styles.section}>
      {displayed ? <EventPriceSubscription eventIds={renderedIds} /> : null}
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
      <SportsEventsError />
    </View>
  );
}

// ============ Subscriptions ================================================== //

/**
 * Subscribes a displayed section's cards to live prices.
 * Renders no UI.
 */
function EventPriceSubscription({ eventIds }: { eventIds: readonly string[] }): null {
  const eventGameIds = useSportsStore(
    state => state.eventGameIds,
    (previous, next) => eventIds.every(id => (previous[id] === null) === (next[id] === null))
  );
  const polymarketEventIds = useMemo(() => eventIds.filter(id => eventGameIds[id] === null), [eventGameIds, eventIds]);
  const eventsById = usePredictionEventsStore(
    state => state.getData(),
    (previous, next) => polymarketEventIds.every(id => previous?.[id] === next?.[id])
  );
  const polymarketTokenIds = useMemo(
    () => polymarketEventIds.flatMap(id => (eventsById?.[id] ? getPolymarketEventsListTokenIds(eventsById[id]) : [])),
    [eventsById, polymarketEventIds]
  );
  const setPrices = useSportsPriceSubscription();

  useEffect(() => setPrices(eventIds, polymarketTokenIds), [eventIds, polymarketTokenIds, setPrices]);

  return null;
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

  if (gameId === null) return <GenericEventCard eventId={eventId} onPress={onPress} />;
  return <Skeleton borderRadius={24} height={166} width="100%" />;
});

function GenericEventCard({
  eventId,
  onPress,
}: {
  eventId: string;
  onPress: (eventId: string, marketName: string, marketSlug?: string) => void;
}): ReactElement {
  const event = usePredictionEventsStore(state => state.getData()?.[eventId]);
  if (!event) return <PredictionEventPlaceholder />;

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

function PredictionEventPlaceholder(): ReactElement {
  const status = usePredictionEventsStore(state => {
    if (state.getStatus('isInitialLoad')) return 'loading';
    return state.error ? 'error' : 'unavailable';
  });

  if (status === 'loading') return <Skeleton borderRadius={24} height={166} width="100%" />;

  return (
    <View style={styles.unavailable}>
      <Text color="labelTertiary" align="center" size="15pt" weight="bold">
        {i18n.t(status === 'error' ? i18n.l.sports.event_error : i18n.l.sports.event_unavailable)}
      </Text>
    </View>
  );
}

// ============ Error ========================================================== //

function SportsEventsError(): ReactElement | null {
  const error = useSportsStore(state => state.getCacheEntry()?.errorInfo?.error);
  if (!error) return null;

  return (
    <ButtonPressAnimation onPress={() => useSportsStore.getState().fetch(undefined, { force: true })} scaleTo={0.98}>
      <Text color="labelTertiary" align="center" size="15pt" weight="bold">
        {i18n.t(i18n.l.sports.error)} · {i18n.t(i18n.l.sports.retry)}
      </Text>
    </ButtonPressAnimation>
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
