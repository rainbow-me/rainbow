import { getPredictionWidgetOutcomes } from '@/features/discover/components/markets/cards/PredictionMarketTileCard';
import { type Display } from '@/features/placements/surfaces/types';
import { getPolymarketEventsListOutcomes } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

/**
 * Returns live-token IDs for the outcomes shown by a prediction display.
 */
export function getPredictionTokenIds(event: PolymarketEvent, display: Display): string[] {
  switch (display) {
    case 'prediction_tile_widget.carousel':
      return getPredictionWidgetOutcomes(event).map(outcome => outcome.tokenId);
    default:
      return getPolymarketEventsListOutcomes(event)
        .map(outcome => outcome.tokenId)
        .filter((tokenId): tokenId is string => Boolean(tokenId));
  }
}
