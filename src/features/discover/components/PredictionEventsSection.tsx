import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { analytics } from '@/analytics';
import { event as analyticsEvent } from '@/analytics/event';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/design-system/components/Text/Text';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { ShowMoreButton } from '@/features/discover/components/markets/layouts/ShowMoreButton';
import { resolveSectionTitle } from '@/features/discover/components/SectionLayout';
import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { hasDestinationRoot, navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { trackDiscoverCardPress } from '@/features/discover/utils/trackDiscoverCardPress';
import { getPredictionPlacement, usePredictionCardsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type SectionId, type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { type PlacementItem } from '@/features/placements/types';
import { PolymarketEventsListItem } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import { useCleanup } from '@/hooks/useCleanup';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';

const EMPTY_ITEMS: PlacementItem[] = [];

// ============ PredictionEventsSection ======================================== //

export function PredictionEventsSection({
  sectionId,
  surface,
  surfaceId,
}: {
  sectionId: SectionId;
  surface: SurfaceLeaf & { placement: string };
  surfaceId: SurfaceId;
}) {
  const [expanded, setExpanded] = useState(false);
  const { width } = useDimensions();

  const placement = usePlacementsStore(state => getPredictionPlacement(state, surface.placement));
  const allItems = placement?.items ?? EMPTY_ITEMS;
  const isLoading = placement === undefined;
  const carousel = surface.display === 'prediction_event_card.carousel';
  const limit = !carousel && expanded ? undefined : surface.limit;
  const items = useMemo(() => (limit !== undefined && allItems.length > limit ? allItems.slice(0, limit) : allItems), [allItems, limit]);
  const cardWidth = width - (carousel && items.length !== 1 ? 30 : 24);
  const title = resolveSectionTitle(surface);
  const destination = hasDestinationRoot(surface.destination, 'predictions') ? surface.destination : undefined;

  useEffect(() => {
    const eventIds = items.map(item => item.id);
    discoverEventListsStore.getState().setList(sectionId, surface.id, eventIds);
  }, [items, sectionId, surface.id]);
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
        itemOrder: placement.items.findIndex(item => item.id === itemId),
        metadata: { marketId: itemId, marketName, marketSlug },
      });
    },
    [placement, surface, surfaceId, title]
  );

  const renderCard = useCallback(
    ({ item }: { item: PlacementItem }) => {
      const eventId = item.id;
      const card = <PredictionEventCard key={eventId} eventId={eventId} onPress={recordPress} />;

      return carousel ? <View style={{ width: cardWidth }}>{card}</View> : card;
    },
    [cardWidth, carousel, recordPress]
  );

  if (!allItems.length && !isLoading) return null;

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
      {isLoading ? (
        <View style={styles.list}>
          <Skeleton borderRadius={24} height={166} width="100%" />
        </View>
      ) : carousel ? (
        <FlatList
          horizontal
          data={items}
          renderItem={renderCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.carousel}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + 8}
          decelerationRate="fast"
          initialNumToRender={3}
          windowSize={3}
        />
      ) : (
        <View style={styles.list}>
          {items.map(item => renderCard({ item }))}
          {!expanded && items.length < allItems.length ? <ShowMoreButton onPress={() => setExpanded(true)} /> : null}
        </View>
      )}
    </View>
  );
}

// ============ Event Cards ==================================================== //

const PredictionEventCard = memo(function PredictionEventCard({
  eventId,
  onPress,
}: {
  eventId: string;
  onPress: (eventId: string, marketName: string, marketSlug?: string) => void;
}) {
  const event = usePredictionCardsStore(getCard => getCard(eventId));

  if (event) {
    return (
      <PolymarketEventsListItem
        event={event}
        onPress={() => {
          onPress(eventId, event.title, event.slug);
          navigateToPolymarketEvent({ eventId, event });
        }}
        shouldActivateOnStart={false}
        style={styles.card}
      />
    );
  }

  if (event === undefined) return <Skeleton borderRadius={24} height={166} width="100%" />;

  return (
    <View style={styles.unavailable}>
      <Text color="labelTertiary" align="center" size="15pt" weight="bold">
        {i18n.t(i18n.l.sports.event_unavailable)}
      </Text>
    </View>
  );
});

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  section: { gap: 20 },
  list: { marginHorizontal: 12, gap: 8 },
  carousel: { paddingHorizontal: 12, gap: 8 },
  card: { width: '100%', height: 166 },
  unavailable: { height: 166, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
