import { memo, useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { StyleSheet, View, type LayoutRectangle } from 'react-native';

import Animated, { runOnJS, useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { analytics } from '@/analytics';
import { event as analyticsEvent } from '@/analytics/event';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Skeleton } from '@/components/Skeleton';
import { useColorMode } from '@/design-system/color/ColorMode';
import { Text } from '@/design-system/components/Text/Text';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { ShowMoreButton } from '@/features/discover/components/markets/layouts/ShowMoreButton';
import { resolveSectionTitle } from '@/features/discover/components/SectionLayout';
import { type DiscoverViewport } from '@/features/discover/types/sectionLayout';
import { hasDestinationRoot, navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { trackPlacementInteraction } from '@/features/placements/engagement/trackInteraction';
import { usePredictionEvent } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';
import { type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import {
  getPolymarketEventsListTokenIds,
  PolymarketEventsListItem,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { type SportsCatalog } from '@/features/sports/core/catalog';
import { useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { GameCard, type SportsGamePress } from '@/features/sports/ui/GameCard';
import { useSportsLookup } from '@/features/sports/ui/useSportsLookup';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';
import { useLiveTokenSubscription } from '@/state/liveTokens/useLiveTokenSubscription';

// ============ PredictionEventsSection ======================================= //

export function PredictionEventsSection({
  surface,
  surfaceId,
  viewport,
  active,
}: {
  surface: SurfaceLeaf & { placement: string };
  surfaceId: SurfaceId;
  viewport: DiscoverViewport;
  active: boolean;
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
  const { owner: lookupOwner, setVisibleEvents } = useSportsLookup(renderedIds, active);
  const cardWidth = width - (renderedIds.length === 1 ? 24 : 30);
  const title = resolveSectionTitle(surface);
  const openGame = useSportsGamePress();

  const sectionTop = useSharedValue(0);
  const cardsTop = useSharedValue(0);
  const scrollX = useSharedValue(0);
  const frames = useSharedValue<Record<string, LayoutRectangle>>({});
  const onScroll = useAnimatedScrollHandler(event => {
    scrollX.value = event.contentOffset.x;
  });

  useEffect(() => {
    frames.modify(previous => {
      'worklet';
      for (const id of Object.keys(previous)) if (!renderedIds.includes(id)) delete previous[id];
      return previous;
    });
  }, [frames, renderedIds]);

  useAnimatedReaction(
    () => {
      const top = viewport.value.top - sectionTop.value - cardsTop.value;
      const bottom = viewport.value.bottom - sectionTop.value - cardsTop.value;
      const left = carousel ? scrollX.value : 0;
      const start = carousel ? Math.max(0, Math.floor((left - 12) / (cardWidth + 8))) : 0;
      const end = carousel ? Math.min(renderedIds.length, Math.ceil((left + width - 12) / (cardWidth + 8))) : renderedIds.length;
      const visibleIds: string[] = [];

      for (let index = start; index < end; index++) {
        const id = renderedIds[index];
        const frame = frames.value[id];
        if (!frame) continue;

        const x = carousel ? 12 + index * (cardWidth + 8) : frame.x;
        const y = carousel ? 0 : frame.y;
        if (y < bottom && y + frame.height > top && x < left + width && x + frame.width > left) visibleIds.push(id);
      }
      return visibleIds;
    },
    (next, previous) => {
      if (!previous || next.length !== previous.length || next.some((id, index) => id !== previous[index])) runOnJS(setVisibleEvents)(next);
    },
    [renderedIds, carousel, cardWidth, setVisibleEvents, width]
  );

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
      <View
        key={eventId}
        onLayout={({ nativeEvent: { layout } }) => {
          frames.modify(previous => {
            'worklet';
            const layouts: Record<string, LayoutRectangle> = previous;
            layouts[eventId] = layout;
            return previous;
          });
        }}
        style={carousel ? { width: cardWidth } : undefined}
      >
        <PredictionEventCard
          catalog={catalog}
          isDarkMode={isDarkMode}
          eventId={eventId}
          width={carousel ? cardWidth : width - 24}
          lookupOwner={lookupOwner}
          onPress={recordPress}
          openGame={openGame}
        />
      </View>
    ),
    [cardWidth, carousel, catalog, frames, isDarkMode, lookupOwner, openGame, recordPress, width]
  );

  if (!eventIds.length && !pending) return null;

  const destination = hasDestinationRoot(surface.destination, 'predictions') ? surface.destination : undefined;

  return (
    <View
      onLayout={({ nativeEvent: { layout } }) => {
        sectionTop.value = layout.y;
      }}
      style={styles.section}
    >
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
      <View
        onLayout={({ nativeEvent: { layout } }) => {
          cardsTop.value = layout.y;
        }}
      >
        {pending && !eventIds.length ? (
          <View style={styles.list}>
            <Skeleton borderRadius={24} height={166} width="100%" />
          </View>
        ) : carousel ? (
          <Animated.FlatList
            horizontal
            data={renderedIds}
            renderItem={renderCard}
            keyExtractor={eventId => eventId}
            contentContainerStyle={styles.carousel}
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + 8}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
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
      <EventLookupStatus owner={lookupOwner} />
    </View>
  );
}

// ============ Event Cards =================================================== //

const PredictionEventCard = memo(function PredictionEventCard({
  catalog,
  isDarkMode,
  eventId,
  width,
  lookupOwner,
  onPress,
  openGame,
}: {
  eventId: string;
  width: number;
  lookupOwner: symbol;
  catalog?: SportsCatalog;
  isDarkMode: boolean;
  onPress: (eventId: string, marketName: string, marketSlug?: string) => void;
  openGame: SportsGamePress;
}): ReactElement {
  const gameId = useSportsStore(state => state.eventGames[eventId]);
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

  if (gameId === null) return <GenericEventCard eventId={eventId} lookupOwner={lookupOwner} onPress={onPress} />;
  return <Skeleton borderRadius={24} height={166} width="100%" />;
});

function GenericEventCard({
  eventId,
  lookupOwner,
  onPress,
}: {
  eventId: string;
  lookupOwner: symbol;
  onPress: (eventId: string, marketName: string, marketSlug?: string) => void;
}): ReactElement {
  const visible = useSportsViewStore(state => {
    const consumer = state.lookupConsumers.get(lookupOwner);
    return Boolean(consumer?.active && consumer.eventIds.includes(eventId) && consumer.visibleIds.includes(eventId));
  });
  const { event, isLoading, error } = usePredictionEvent(eventId, visible);
  const subscribe = useLiveTokenSubscription();
  useEffect(() => subscribe(visible && event ? getPolymarketEventsListTokenIds(event) : []), [event, subscribe, visible]);

  if (!event) {
    return isLoading || !visible ? (
      <Skeleton borderRadius={24} height={166} width="100%" />
    ) : (
      <View style={styles.unavailable}>
        <Text color="labelTertiary" align="center" size="15pt" weight="bold">
          {i18n.t(error ? i18n.l.sports.event_error : i18n.l.sports.event_unavailable)}
        </Text>
      </View>
    );
  }

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

// ============ Lookup Status ================================================= //

function EventLookupStatus({ owner }: { owner: symbol }): ReactElement | null {
  const active = useSportsViewStore(state => {
    const consumer = state.lookupConsumers.get(owner);
    return Boolean(consumer?.active && consumer.visibleIds.some(id => consumer.eventIds.includes(id)));
  });
  const error = useSportsStore(state => state.getCacheEntry()?.errorInfo?.error);

  if (!active || !error) return null;

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
