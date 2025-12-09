import { TextColor } from '@/design-system/color/palettes';
import { USD_DECIMALS } from '@/features/perps/constants';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { abs, add, greaterThan, isEqual, isZero } from '@/helpers/utilities';
import { truncateToDecimals } from '@/safe-math/SafeMath';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { PolymarketPosition } from '@/features/polymarket/types';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';

export type PolymarketAccountInfo = {
  balance: string;
  equity: string;
  hasBalance: boolean;
  hasPositions: boolean;
  isNeutralPnl: boolean;
  isPositivePnl: boolean;
  positions: PolymarketPosition[];
  activePositions: PolymarketPosition[];
  textColor: TextColor;
  unrealizedPnl: string;
  value: string;
};

const EMPTY_ACCOUNT_INFO = Object.freeze<PolymarketAccountInfo>({
  balance: '0',
  equity: formatCurrency('0'),
  hasBalance: false,
  hasPositions: false,
  isNeutralPnl: true,
  isPositivePnl: false,
  textColor: 'labelTertiary',
  positions: [],
  activePositions: [],
  unrealizedPnl: formatCurrency(abs('0')),
  value: '0',
});

export const usePolymarketAccountInfo = createDerivedStore<PolymarketAccountInfo>(
  $ => {
    const balance = $(usePolymarketBalanceStore, state => truncateToDecimals(state.getBalance(), USD_DECIMALS));
    const positions = $(usePolymarketPositionsStore, state => state.getPositions() ?? []);

    if (!positions.length && !balance) return EMPTY_ACCOUNT_INFO;

    let totalPositionsEquity = '0';
    let totalPositionsPnl = '0';
    let totalPositionsInitialValue = '0';

    positions.forEach(position => {
      totalPositionsEquity = add(totalPositionsEquity, position.currentValue);
      totalPositionsPnl = add(totalPositionsPnl, position.cashPnl);
      totalPositionsInitialValue = add(totalPositionsInitialValue, position.initialValue);
    });

    const isNeutralPnl = isEqual(totalPositionsPnl, 0);
    const isPositivePnl = greaterThan(totalPositionsPnl, 0);
    const textColor = isPositivePnl ? 'green' : isNeutralPnl ? 'labelTertiary' : 'red';

    return {
      balance,
      equity: formatCurrency(totalPositionsEquity),
      hasBalance: !isZero(balance),
      hasPositions: positions.length > 0,
      activePositions: positions.filter(position => !(position.redeemable && position.currentValue === 0)),
      positions,
      isNeutralPnl,
      isPositivePnl,
      textColor: textColor satisfies TextColor,
      unrealizedPnl: formatCurrency(abs(totalPositionsPnl)),
      value: add(balance, totalPositionsEquity),
    };
  },

  { fastMode: true }
);
