import { createDerivedStore } from '@storesjs/stores';

import { type TextColor } from '@/design-system/color/palettes';
import { USD_DECIMALS } from '@/features/currency/constants';
import { formatUsd } from '@/features/currency/utils/formatUsd';
import { usePolymarketPositions } from '@/features/polymarket/stores/derived/usePolymarketPositions';
import { getPositionTokenId } from '@/features/polymarket/utils/getPositionTokenId';
import { toFixedWorklet, truncateToDecimals } from '@/framework/core/safeMath';
import { abs, add, divide, greaterThan, isEqual, multiply, subtract } from '@/helpers/utilities';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { shallowEqual } from '@/worklets/comparisons';

export type PolymarketPositionsSummary = {
  value: string;
  valueFormatted: string;
  hasActivePositions: boolean;
  isNeutralPnl: boolean;
  isPositivePnl: boolean;
  textColor: TextColor;
  unrealizedPnl: string;
  unrealizedPnlPercent: `${string}%`;
};

const EMPTY_VALUE: PolymarketPositionsSummary = {
  value: '0',
  valueFormatted: formatUsd('0'),
  hasActivePositions: false,
  isNeutralPnl: true,
  isPositivePnl: false,
  textColor: 'labelTertiary',
  unrealizedPnl: formatUsd('0'),
  unrealizedPnlPercent: `${toFixedWorklet('0', 2)}%`,
};

export const usePolymarketPositionsSummary = createDerivedStore<PolymarketPositionsSummary>(
  $ => {
    const { activePositions } = $(usePolymarketPositions);
    const liveTokens = $(useLiveTokensStore, state => state.tokens);

    if (!activePositions.length) return EMPTY_VALUE;

    let totalLiveValue = '0';
    let totalInitialValue = '0';

    activePositions.forEach(position => {
      if (position.redeemable) {
        totalLiveValue = add(totalLiveValue, position.currentValue);
      } else {
        const tokenId = getPositionTokenId(position);
        const liveToken = liveTokens[tokenId];
        const positionValue = liveToken?.price ? multiply(position.size, liveToken.price) : position.currentValue;
        totalLiveValue = add(totalLiveValue, positionValue);
      }
      totalInitialValue = add(totalInitialValue, position.initialValue);
    });

    const totalPnl = subtract(totalLiveValue, totalInitialValue);
    const isNeutralPnl = isEqual(totalPnl, 0);
    const isPositivePnl = greaterThan(totalPnl, 0);
    const textColor: TextColor = isPositivePnl ? 'green' : isNeutralPnl ? 'labelTertiary' : 'red';

    const pnlPercent = totalInitialValue === '0' ? '0' : multiply(divide(totalPnl, totalInitialValue), '100');

    return {
      value: truncateToDecimals(totalLiveValue, USD_DECIMALS),
      valueFormatted: formatUsd(totalLiveValue),
      hasActivePositions: true,
      isNeutralPnl,
      isPositivePnl,
      textColor,
      unrealizedPnl: formatUsd(abs(totalPnl)),
      unrealizedPnlPercent: `${toFixedWorklet(abs(pnlPercent), 2)}%`,
    };
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
