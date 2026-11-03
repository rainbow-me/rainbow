import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { analytics } from '@/analytics';
import { event as analyticsEvent } from '@/analytics/event';
import { Skeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/features/discover/components/markets/layouts/SectionHeader';
import { ShowMoreButton } from '@/features/discover/components/markets/layouts/ShowMoreButton';
import { resolveSectionTitle } from '@/features/discover/components/SectionLayout';
import { usePredictionsPlacement, type PredictionPlacementItem } from '@/features/discover/hooks/usePredictionsPlacement';
import { useTrackDiscoverCarouselScroll } from '@/features/discover/hooks/useTrackDiscoverCarouselScroll';
import { type PlacementSurface } from '@/features/discover/types/sectionLayout';
import { hasDestinationRoot, navigateDiscoverDestination } from '@/features/discover/utils/navigation';
import { trackDiscoverCardPress } from '@/features/discover/utils/trackDiscoverCardPress';
import { getPredictionPlacement } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type SectionId, type SurfaceId } from '@/features/placements/surfaces/types';
import {
  PolymarketEventsListItem,
  HEIGHT as PREDICTION_CARD_HEIGHT,
} from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { navigateToPolymarketEvent } from '@/features/polymarket/utils/navigateToPolymarket';
import useDimensions from '@/hooks/useDimensions';

const HORIZONTAL_INSET = 12;
const CARD_GAP = 8;
const NEXT_CARD_PEEK = 10;

// ============ PredictionEventsSection ======================================== //

export function PredictionEventsSection({
  sectionId,
  surface,
  surfaceId,
}: {
  sectionId: SectionId;
  surface: PlacementSurface;
  surfaceId: SurfaceId;
}) {
  const { width } = useDimensions();

  const placement = usePlacementsStore(s => getPredictionPlacement(s, surface.placement));
  const { items, hasMore, setLimit } = usePredictionsPlacement(surface, sectionId);

  const carousel = surface.display === 'prediction_event_card.carousel';
  const isFullWidthCard = !carousel || items?.length === 1;
  const cardWidth = width - (isFullWidthCard ? HORIZONTAL_INSET * 2 : HORIZONTAL_INSET + CARD_GAP + NEXT_CARD_PEEK);
  const title = resolveSectionTitle(surface);
  const onScrollSettle = useTrackDiscoverCarouselScroll(surface, surfaceId, title);
  const destination = hasDestinationRoot(surface.destination, 'predictions') ? surface.destination : undefined;

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
    ({ item }: { item: PredictionPlacementItem }) => {
      const card = <PredictionEventCard key={item.id} event={item.event} onPress={recordPress} />;

      return carousel ? <View style={{ width: cardWidth }}>{card}</View> : card;
    },
    [cardWidth, carousel, recordPress]
  );

  if (items?.length === 0) return null;

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
      {!items ? (
        <View style={styles.list}>
          <Skeleton borderRadius={24} height={PREDICTION_CARD_HEIGHT} width="100%" />
        </View>
      ) : carousel ? (
        <FlatList
          horizontal
          data={items}
          renderItem={renderCard}
          onMomentumScrollEnd={onScrollSettle}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.carousel}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + CARD_GAP}
          decelerationRate="fast"
          initialNumToRender={3}
          windowSize={3}
        />
      ) : (
        <View style={styles.list}>
          {items.map(item => renderCard({ item }))}
          {hasMore ? <ShowMoreButton onPress={() => setLimit(undefined)} /> : null}
        </View>
      )}
    </View>
  );
}

// ============ Event Cards ==================================================== //

const PredictionEventCard = memo(function PredictionEventCard({
  event,
  onPress,
}: {
  event: PolymarketEvent;
  onPress: (eventId: string, marketName: string, marketSlug?: string) => void;
}) {
  return (
    <PolymarketEventsListItem
      event={event}
      onPress={() => {
        onPress(event.id, event.title, event.slug);
        navigateToPolymarketEvent({ eventId: event.id, event });
      }}
      shouldActivateOnStart={false}
      style={styles.card}
    />
  );
});

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  section: { gap: 20 },
  list: { marginHorizontal: HORIZONTAL_INSET, gap: CARD_GAP },
  carousel: { paddingHorizontal: HORIZONTAL_INSET, gap: CARD_GAP },
  card: { width: '100%', height: PREDICTION_CARD_HEIGHT },
});
