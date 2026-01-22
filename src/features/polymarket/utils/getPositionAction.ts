import { PolymarketPosition } from '@/features/polymarket/types';

export const PositionAction = {
  CLEAR: 'clear',
  CASH_OUT: 'cash_out',
  CLAIM: 'claim',
} as const;

export function getPositionAction(position: PolymarketPosition) {
  if (position.redeemable) {
    const isWin = position.size === position.currentValue;
    return isWin ? PositionAction.CLAIM : PositionAction.CLEAR;
  }
  return PositionAction.CASH_OUT;
}
