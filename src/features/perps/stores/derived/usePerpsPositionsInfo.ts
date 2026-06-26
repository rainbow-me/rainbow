import { createDerivedStore } from '@storesjs/stores';

import { type TextColor } from '@/design-system/color/palettes';
import { USD_DECIMALS } from '@/features/currency/constants';
import { formatUsd } from '@/features/currency/utils/formatUsd';
import { type PerpsPosition } from '@/features/perps/types';
import { toFixedWorklet, truncateToDecimals } from '@/framework/core/safeMath';
import { abs, add, divide, greaterThan, isEqual, isZero, multiply, subtract } from '@/helpers/utilities';

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
  equity: formatUsd('0'),
  hasBalance: false,
  hasPositions: false,
  isNeutralPnl: true,
  isPositivePnl: false,
  textColor: 'labelTertiary',
  positions: [],
  unrealizedPnl: formatUsd(abs('0')),
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

    const balance = truncateToDecimals(accountData.balance, USD_DECIMALS);

    return {
      balance,
      equity: formatUsd(totalPositionsEquity),
      hasBalance: !isZero(accountData.balance),
      hasPositions: positions.length > 0,
      positions,
      isNeutralPnl,
      isPositivePnl,
      textColor: textColor satisfies TextColor,
      unrealizedPnl: formatUsd(abs(totalPositionsPnl)),
      unrealizedPnlPercent: `${toFixedWorklet(abs(unrealizedPnlPercent), 2)}%`,
      value: accountData.value,
    };
  },

  { lockDependencies: true }
);
