import { PolymarketPosition } from '@/features/polymarket/types';

export const PositionAction = {
  CLAIM: 'claim',
  BURN: 'burn',
  CASH_OUT: 'cash_out',
} as const;

export function getPositionAction(position: PolymarketPosition) {
  const redeemable = position.redeemable;
  const isWin = redeemable && position.size === position.currentValue;
  if (redeemable) {
    if (isWin) return PositionAction.CLAIM;
    return PositionAction.BURN;
  }
  return PositionAction.CASH_OUT;
}
