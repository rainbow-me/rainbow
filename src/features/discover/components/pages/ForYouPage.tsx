import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import { PerpMarketsCarousel } from '@/features/discover/components/carousels/PerpMarketsCarousel';
import { PredictionsCarousel } from '@/features/discover/components/carousels/PredictionsCarousel';
import { TokenList } from '@/features/discover/components/TokenList';
import { SECTION_VERTICAL_GAP } from '@/features/discover/constants';
import { navigateToPolymarketCategory, navigateToPolymarketSportsLeague } from '@/features/discover/utils/navigation';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePerpsPlacementStore } from '@/features/placements/stores/derived/perpsPlacementStore';
import {
  usePredictionsPlacementStore,
  usePredictionsSportsPlacementStore,
} from '@/features/placements/stores/derived/predictionsPlacementStore';
import {
  HEIGHT as POLYMARKET_SPORT_EVENT_LIST_ITEM_HEIGHT,
  PolymarketSportEventListItem,
  LoadingSkeleton as PolymarketSportEventListItemSkeleton,
} from '@/features/polymarket/components/polymarket-sport-event-list-item/PolymarketSportEventListItem';
import { CATEGORIES } from '@/features/polymarket/constants';
import { getLeagueId } from '@/features/polymarket/leagues';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import * as i18n from '@/languages';

const NBA_PREVIEW_EVENT_COUNT = 2;

export function ForYouPage() {
  return (
    <View style={styles.container}>
      <ForYouPerpsCarousel />
      <ForYouPredictionsCarousel />
      <ForYouTokensSection />
      <ForYouNbaSection />
      <ForYouSportsCarousel />
    </View>
  );
}

function ForYouPerpsCarousel() {
  const { isLoading, items, placement } = usePerpsPlacementStore();
  return (
    <PerpMarketsCarousel
      isLoading={isLoading}
      items={items}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS}
      title={i18n.t(i18n.l.discover.placements.perps_title)}
    />
  );
}

function ForYouPredictionsCarousel() {
  const { isLoading, items, placement } = usePredictionsPlacementStore();
  return (
    <PredictionsCarousel
      isLoading={isLoading}
      items={items}
      placement={placement}
      placementId={PLACEMENT_IDS.PREDICTIONS}
      title={i18n.t(i18n.l.discover.placements.predictions_title)}
    />
  );
}

function ForYouSportsCarousel() {
  const { isLoading, items, placement } = usePredictionsSportsPlacementStore();
  return (
    <PredictionsCarousel
      isLoading={isLoading}
      items={items}
      onPressSeeAll={() => navigateToPolymarketCategory(CATEGORIES.sports.tagId)}
      placement={placement}
      placementId={PLACEMENT_IDS.PREDICTIONS_SPORTS}
      title="Sports"
    />
  );
}

function ForYouTokensSection() {
  const { onTapSearch } = useDiscoverScreenContext();
  return (
    <View style={styles.tokensSection}>
      <CarouselHeader title="Tokens" onPress={onTapSearch} />
      <TokenList />
    </View>
  );
}

function ForYouNbaSection() {
  const events = usePolymarketSportsEventsStore(state => state.getData() ?? []);
  const isLoading = usePolymarketSportsEventsStore(state => state.getStatus('isLoading'));
  const nbaEvents = useMemo(() => events.filter(event => getLeagueId(event.slug) === 'nba').slice(0, NBA_PREVIEW_EVENT_COUNT), [events]);

  if (!isLoading && !nbaEvents.length) return null;

  return (
    <View style={styles.nbaSection}>
      <CarouselHeader title="NBA" onPress={() => navigateToPolymarketSportsLeague('nba')} />
      <View style={styles.nbaList}>
        {isLoading && !nbaEvents.length
          ? Array.from({ length: NBA_PREVIEW_EVENT_COUNT }).map((_, index) => (
              <View key={index} style={styles.nbaEventItem}>
                <PolymarketSportEventListItemSkeleton />
              </View>
            ))
          : nbaEvents.map(event => <PolymarketSportEventListItem key={event.id} event={event} style={styles.nbaEventItem} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    gap: SECTION_VERTICAL_GAP,
  },
  tokensSection: {
    gap: 20,
  },
  nbaSection: {
    gap: 20,
  },
  nbaList: {
    gap: 8,
    paddingHorizontal: 12,
  },
  nbaEventItem: {
    height: POLYMARKET_SPORT_EVENT_LIST_ITEM_HEIGHT,
  },
});
