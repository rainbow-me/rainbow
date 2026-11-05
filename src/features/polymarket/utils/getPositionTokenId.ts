import { type PolymarketPosition } from '@/features/polymarket/types';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

export function getPositionTokenId(position: PolymarketPosition): string {
  return getPolymarketTokenId(position.asset, 'buy');
}
