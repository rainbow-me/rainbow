import { Fragment, memo, useMemo, useState } from 'react';
import { HlTrade, PerpMarket } from '@/features/perps/types';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { tradeExecutionDescriptions, useHlTradesStore } from '@/features/perps/stores/hlTradesStore';
import { Box, Separator, Text, TextShadow } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { format } from 'date-fns';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';

const DEFAULT_VISIBLE_TRADE_COUNT = 10;

const descriptionIcons = {
  [tradeExecutionDescriptions.longLiquidated]: '􀁞',
  [tradeExecutionDescriptions.shortLiquidated]: '􀁞',
  [tradeExecutionDescriptions.longOpened]: '􀁌',
  [tradeExecutionDescriptions.shortOpened]: '􀁌',
  [tradeExecutionDescriptions.longClosed]: '􀁎',
  [tradeExecutionDescriptions.shortClosed]: '􀁎',
  [tradeExecutionDescriptions.takeProfitExecuted]: '􀑁',
  [tradeExecutionDescriptions.stopLossExecuted]: '􁘳',
};

const TradeListItem = memo(function TradeListItem({ trade }: { trade: HlTrade }) {
  const pnlValue = Number(trade.pnl);
  const isPositivePnl = pnlValue >= 0;
  const pnlColor = isPositivePnl ? 'green' : 'red';

  const formattedDate = useMemo(() => {
    return format(trade.executedAt, 'MMM d, HH:mm');
  }, [trade.executedAt]);

  const leftHandSide = useMemo(() => {
    if (trade.triggerOrderType) {
      return `${toFixedWorklet(divWorklet(trade.fillStartSize, trade.size), 2)}%`;
    }

    return formatCurrency(mulWorklet(trade.size, trade.price), {
      useCompactNotation: false,
    });
  }, [trade]);

  const pnl = useMemo(() => {
    return `${isPositivePnl ? '+' : ''} ${formatCurrency(trade.pnl)}`;
  }, [trade.pnl, isPositivePnl]);

  const isLiquidation =
    trade.description === tradeExecutionDescriptions.longLiquidated || trade.description === tradeExecutionDescriptions.shortLiquidated;
  const descriptionColor = isLiquidation ? 'red' : 'labelTertiary';
  const descriptionIcon = descriptionIcons[trade.description as keyof typeof descriptionIcons];

  return (
    <Box paddingVertical="16px" gap={12}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box flexDirection="row" alignItems="center" gap={2}>
          <Text size="12pt" weight="semibold" color={descriptionColor}>
            {descriptionIcon}
          </Text>
          <Text size="13pt" weight="semibold" color={descriptionColor}>
            {trade.description}
          </Text>
        </Box>
        <Text size="13pt" color="labelQuaternary" weight="medium">
          {formattedDate}
        </Text>
      </Box>

      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text size="17pt" color="label" weight="semibold">
          {leftHandSide}
          <Text size="17pt" color="labelTertiary" weight="semibold">
            {' @ '}
          </Text>
          {formatPerpAssetPrice(trade.price)}
        </Text>
        {pnlValue !== 0 && (
          <Text size="17pt" weight="semibold" color={pnlColor}>
            {pnl}
          </Text>
        )}
      </Box>
    </Box>
  );
});

export const HistorySection = memo(function HistorySection({ market }: { market: PerpMarket }) {
  const { accentColors } = usePerpsAccentColorContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const historyData = useHlTradesStore(state => state.tradesBySymbol);

  const trades = historyData[market.symbol] || [];
  const visibleTrades = isExpanded ? trades : trades.slice(0, DEFAULT_VISIBLE_TRADE_COUNT);

  if (trades.length === 0) {
    return (
      <Box alignItems="center" justifyContent="center" paddingVertical="24px">
        <Text weight="bold" size="17pt" color="label">
          No trades
        </Text>
      </Box>
    );
  }

  return (
    <Box gap={16}>
      {(isExpanded || trades.length > 0) && (
        <Box gap={12}>
          <Box>
            {visibleTrades.map((trade, index) => (
              <Fragment key={trade.id}>
                <TradeListItem key={trade.id} trade={trade} />
                {index < visibleTrades.length - 1 && <Separator color={'separatorTertiary'} direction="horizontal" thickness={4 / 3} />}
              </Fragment>
            ))}
          </Box>

          {trades.length > DEFAULT_VISIBLE_TRADE_COUNT && !isExpanded && (
            <ButtonPressAnimation onPress={() => setIsExpanded(true)} scaleTo={0.98}>
              <Box
                backgroundColor={accentColors.opacity3}
                borderRadius={18}
                borderWidth={4 / 3}
                borderColor={{ custom: accentColors.opacity6 }}
                padding="12px"
                alignItems="center"
              >
                <TextShadow blur={12} shadowOpacity={0.24}>
                  <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
                    {'More'}
                  </Text>
                </TextShadow>
              </Box>
            </ButtonPressAnimation>
          )}
        </Box>
      )}
    </Box>
  );
});
