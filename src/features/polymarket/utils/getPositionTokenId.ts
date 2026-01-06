import { PolymarketPosition } from '@/features/polymarket/types';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

export function getPositionTokenId(position: PolymarketPosition): string {
  const outcomeIndex = position.outcomes.indexOf(position.outcome);
  return getPolymarketTokenId(position.market.clobTokenIds[outcomeIndex], 'buy');
}
