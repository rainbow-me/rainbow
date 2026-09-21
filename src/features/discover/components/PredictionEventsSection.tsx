import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutRectangle } from 'react-native';

import { shallowEqual } from '@storesjs/stores';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { analytics } from '@/analytics';
import { event as analyticsEvent } from '@/analytics/event';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/design-system';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { ShowMoreButton } from '@/features/discover/components/markets/layouts/ShowMoreButton';
import { resolveSectionTitle } from '@/features/discover/components/SectionLayout';
import { type DiscoverViewport } from '@/features/discover/types/sectionLayout';
import { hasDestinationRoot, navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { trackPlacementInteraction } from '@/features/placements/engagement/trackInteraction';
import { usePredictionEvent } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { selectPlacementItemsBySource, usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useIsDiscoverSurfacePlacementPending } from '@/features/placements/surfaces/hooks/useDiscoverSurfacePlacements';
import { type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type PlacementItem } from '@/features/placements/types';
import {
  getPolymarketEventsListTokenIds,
  PolymarketEventsListItem,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { GameCard } from '@/features/sports/ui/GameCard';
import { useSportsLookup } from '@/features/sports/ui/useSportsLookup';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';
import { useLiveTokenSubscription } from '@/state/liveTokens/useLiveTokenSubscription';

/** Event-card placements resolve as Games first; only an unavailable result admits generic hydration. */
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
}) {
  const placement = usePlacementsStore(state => state.getPlacement(surface.placement));
  const items = usePlacementsStore(
    state => [...new Map(selectPlacementItemsBySource(state, surface.placement, 'polymarket').map(item => [item.id, item])).values()],
    shallowEqual
  );
  const pending = useIsDiscoverSurfacePlacementPending(surface.placement);
  const [expanded, setExpanded] = useState(false);
  const { width } = useDimensions();
  const carousel = surface.display === 'prediction_event_card.carousel';
  const renderedItems = useMemo(
    () => (!carousel && expanded ? items : items.slice(0, surface.limit)),
    [carousel, expanded, items, surface.limit]
  );
  const ids = useMemo(() => renderedItems.map(item => item.id), [renderedItems]);
  const { owner: lookupOwner, setVisibleEvents } = useSportsLookup(ids, active);
  const cardWidth = width - (renderedItems.length === 1 ? 24 : 30);
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
      for (const id of Object.keys(previous)) if (!ids.includes(id)) delete previous[id];
      return previous;
    });
  }, [frames, ids]);

  useAnimatedReaction(
    () => {
      const top = viewport.value.top - sectionTop.value - cardsTop.value;
      const bottom = viewport.value.bottom - sectionTop.value - cardsTop.value;
      const left = carousel ? scrollX.value : 0;
      return ids.filter((id, index) => {
        const frame = frames.value[id];
        if (!frame) return false;
        // Horizontal FlatList reports each child's position within its own cell.
        const x = carousel ? 12 + index * (cardWidth + 8) : frame.x;
        const y = carousel ? 0 : frame.y;
        return y < bottom && y + frame.height > top && x < left + width && x + frame.width > left;
      });
    },
    (next, previous) => {
      if (!previous || next.length !== previous.length || next.some((id, index) => id !== previous[index])) runOnJS(setVisibleEvents)(next);
    },
    [ids, carousel, cardWidth, setVisibleEvents, width]
  );

  const recordPress = useCallback(
    (itemId: string, marketName: string, marketSlug?: string) => {
      if (!placement) return;
      const itemOrder = items.findIndex(item => item.id === itemId);
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
    [items, placement, surface.display, surface.id, surfaceId, title]
  );

  const renderCard = useCallback(
    ({ item }: { item: PlacementItem }) => (
      <View
        key={item.id}
        onLayout={({ nativeEvent: { layout } }) => {
          frames.modify(previous => {
            'worklet';
            return { ...previous, [item.id]: layout };
          });
        }}
        style={carousel ? { width: cardWidth } : undefined}
      >
        <PredictionEventCard
          eventId={item.id}
          width={carousel ? cardWidth : width - 24}
          lookupOwner={lookupOwner}
          onPress={recordPress}
          openGame={openGame}
        />
      </View>
    ),
    [cardWidth, carousel, frames, lookupOwner, openGame, recordPress, width]
  );

  if (!items.length && !pending) return null;
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
        {pending && !items.length ? (
          <View style={styles.list}>
            <Skeleton borderRadius={24} height={166} width="100%" />
          </View>
        ) : carousel ? (
          <Animated.FlatList
            horizontal
            data={renderedItems}
            renderItem={renderCard}
            keyExtractor={item => item.id}
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
            {renderedItems.map(item => renderCard({ item }))}
            {!expanded && renderedItems.length < items.length && <ShowMoreButton onPress={() => setExpanded(true)} />}
          </View>
        )}
      </View>
      <EventLookupStatus owner={lookupOwner} />
    </View>
  );
}

const PredictionEventCard = memo(function PredictionEventCard({
  eventId,
  width,
  lookupOwner,
  onPress,
  openGame,
}: {
  eventId: string;
  width: number;
  lookupOwner: symbol;
  onPress: (eventId: string, marketName: string, marketSlug?: string) => void;
  openGame: ReturnType<typeof useSportsGamePress>;
}) {
  const gameId = useSportsStore(state => state.eventGames[eventId]);
  if (gameId)
    return (
      <GameCard
        gameId={gameId}
        width={width}
        onPress={(id, selection) => {
          const game = useSportsStore.getState().games[id];
          if (game) onPress(eventId, game.participants.map(participant => participant.name).join(' vs. '));
          openGame(id, selection);
        }}
      />
    );
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
}) {
  const visible = useSportsViewStore(state => {
    const consumer = state.lookupConsumers.get(lookupOwner);
    return Boolean(consumer?.active && consumer.eventIds.includes(eventId) && consumer.visibleIds.includes(eventId));
  });
  const { event, isLoading, error } = usePredictionEvent(eventId, visible);
  const subscribe = useLiveTokenSubscription();
  useEffect(() => subscribe(visible && event ? getPolymarketEventsListTokenIds(event) : []), [event, subscribe, visible]);
  if (!event)
    return isLoading || !visible ? (
      <Skeleton borderRadius={24} height={166} width="100%" />
    ) : (
      <View style={styles.unavailable}>
        <Text color="labelTertiary" align="center" size="15pt" weight="bold">
          {i18n.t(error ? i18n.l.sports.event_error : i18n.l.sports.event_unavailable)}
        </Text>
      </View>
    );
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

function EventLookupStatus({ owner }: { owner: symbol }) {
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

const styles = StyleSheet.create({
  section: { gap: 20 },
  list: { marginHorizontal: 12, gap: 8 },
  carousel: { paddingHorizontal: 12, gap: 8 },
  genericCard: { width: '100%', height: 166 },
  unavailable: { height: 166, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
