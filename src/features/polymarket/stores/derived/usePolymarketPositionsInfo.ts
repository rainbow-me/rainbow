import { TextColor } from '@/design-system/color/palettes';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { usePolymarketAccountInfo } from '@/features/polymarket/stores/derived/usePolymarketAccountInfo';
import { PolymarketPosition } from '@/features/polymarket/types';
import { abs, add, divide, greaterThan, isEqual, isZero, multiply } from '@/helpers/utilities';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { createDerivedStore } from '@/state/internal/createDerivedStore';

export type PolymarketPositionsInfo = {
  balance: string;
  equity: string;
  hasBalance: boolean;
  hasPositions: boolean;
  isNeutralPnl: boolean;
  isPositivePnl: boolean;
  positions: PolymarketPosition[];
  textColor: TextColor;
  unrealizedPnl: string;
  unrealizedPnlPercent: `${string}%`;
  value: string;
};

const EMPTY_POSITIONS_INFO = Object.freeze<PolymarketPositionsInfo>({
  balance: '0',
  equity: formatCurrency('0'),
  hasBalance: false,
  hasPositions: false,
  isNeutralPnl: true,
  isPositivePnl: false,
  textColor: 'labelTertiary',
  positions: [],
  unrealizedPnl: formatCurrency(abs('0')),
  unrealizedPnlPercent: `${toFixedWorklet('0', 2)}%`,
  value: '0',
});

export const usePolymarketPositionsInfo = createDerivedStore<PolymarketPositionsInfo>(
  $ => {
    const balance = $(usePolymarketAccountInfo, state => state.balance);
    const positions = $(usePolymarketAccountInfo, state => state.positions);

    if (!positions.length && !balance) return EMPTY_POSITIONS_INFO;

    let totalPositionsInitialValue = '0';
    let totalPositionsEquity = '0';
    let totalPositionsPnl = '0';

    positions.forEach(position => {
      totalPositionsEquity = add(totalPositionsEquity, position.currentValue);
      totalPositionsPnl = add(totalPositionsPnl, position.cashPnl);
      totalPositionsInitialValue = add(totalPositionsInitialValue, position.initialValue);
    });

    const isNeutralPnl = isEqual(totalPositionsPnl, 0);
    const isPositivePnl = greaterThan(totalPositionsPnl, 0);
    const textColor = isPositivePnl ? 'green' : isNeutralPnl ? 'labelTertiary' : 'red';

    const unrealizedPnlPercent = toFixedWorklet(
      totalPositionsInitialValue === '0' ? '0' : multiply(divide(totalPositionsPnl, totalPositionsInitialValue), 100),
      2
    );

    return {
      balance,
      equity: formatCurrency(totalPositionsEquity),
      hasBalance: !isZero(balance),
      hasPositions: positions.length > 0,
      positions,
      isNeutralPnl,
      isPositivePnl,
      textColor: textColor satisfies TextColor,
      unrealizedPnl: formatCurrency(abs(totalPositionsPnl)),
      unrealizedPnlPercent: `${toFixedWorklet(abs(unrealizedPnlPercent), 2)}%`,
      value: add(balance, totalPositionsEquity),
    };
  },

  { fastMode: true }
);
