import { PolymarketPosition } from '@/features/polymarket/types';

export const PositionAction = {
  BURN: 'burn',
  CASH_OUT: 'cash_out',
  CLAIM: 'claim',
} as const;

export function getPositionAction(position: PolymarketPosition) {
  if (position.redeemable) {
    const isWin = position.size === position.currentValue;
    return isWin ? PositionAction.CLAIM : PositionAction.BURN;
  }
  return PositionAction.CASH_OUT;
}
