import { TextColor } from '@/design-system/color/palettes';
import { abs, add, divide, greaterThan, isEqual, multiply, subtract } from '@/helpers/utilities';
import { PerpsPosition } from '@/features/perps/types';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { PERPS_EMPTY_ACCOUNT_DATA, useHyperliquidAccountStore } from '../hyperliquidAccountStore';

export type PerpsPositionsInfo = {
  balance: string;
  equity: string;
  hasBalance: boolean;
  hasPositions: boolean;
  isNeutralPnl: boolean;
  isPositivePnl: boolean;
  positions: PerpsPosition[];
  textColor: TextColor;
  unrealizedPnl: string;
  unrealizedPnlPercent: `${string}%`;
  value: string;
};

const EMPTY_POSITIONS_INFO = Object.freeze<PerpsPositionsInfo>({
  balance: PERPS_EMPTY_ACCOUNT_DATA.balance,
  equity: formatCurrency('0'),
  hasBalance: false,
  hasPositions: false,
  isNeutralPnl: true,
  isPositivePnl: false,
  textColor: 'labelTertiary',
  positions: [],
  unrealizedPnl: formatCurrency(abs('0')),
  unrealizedPnlPercent: `${toFixedWorklet('0', 2)}%`,
  value: PERPS_EMPTY_ACCOUNT_DATA.value,
});

export const usePerpsPositionsInfo = createDerivedStore<PerpsPositionsInfo>(
  $ => {
    const accountData = $(useHyperliquidAccountStore, state => state.getData());
    if (!accountData) return EMPTY_POSITIONS_INFO;

    const positions = Object.values(accountData.positions);

    let totalPositionsEquity = '0';
    let totalPositionsPnl = '0';

    positions.forEach(position => {
      totalPositionsEquity = add(totalPositionsEquity, position.equity);
      totalPositionsPnl = add(totalPositionsPnl, position.unrealizedPnl);
    });

    const isNeutralPnl = isEqual(totalPositionsPnl, 0);
    const isPositivePnl = greaterThan(totalPositionsPnl, 0);
    const textColor = isPositivePnl ? 'green' : isNeutralPnl ? 'labelTertiary' : 'red';

    const initialMargin = subtract(totalPositionsEquity, totalPositionsPnl);
    const unrealizedPnlPercent = toFixedWorklet(initialMargin === '0' ? '0' : multiply(divide(totalPositionsPnl, initialMargin), 100), 2);

    return {
      balance: accountData.balance,
      equity: formatCurrency(totalPositionsEquity),
      hasBalance: accountData.balance !== '0',
      hasPositions: positions.length > 0,
      positions,
      isNeutralPnl,
      isPositivePnl,
      textColor: textColor satisfies TextColor,
      unrealizedPnl: formatCurrency(abs(totalPositionsPnl)),
      unrealizedPnlPercent: `${toFixedWorklet(abs(unrealizedPnlPercent), 2)}%`,
      value: accountData.value,
    };
  },

  { fastMode: true }
);
