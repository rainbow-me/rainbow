import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { HlTrade } from '@/features/perps/types';
import { tradeExecutionDescriptions } from '@/features/perps/stores/hlTradesStore';
import { Box, Text, TextIcon } from '@/design-system';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { format } from 'date-fns';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { abs } from '@/helpers/utilities';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';

const LARGE_SPACE = ' ';

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

type TradeListItemProps = {
  trade: HlTrade;
  showMarketIcon?: boolean;
};

export const TradeListItem = memo(function TradeListItem({ trade, showMarketIcon = false }: TradeListItemProps) {
  const pnlValue = Number(trade.pnl);
  const isPositivePnl = pnlValue >= 0;
  const pnlColor = isPositivePnl ? 'green' : 'red';

  const formattedDate = useMemo(() => {
    return format(trade.executedAt, 'MMM d, h:mm aaa');
  }, [trade.executedAt]);

  const leftHandSide = useMemo(() => {
    if (trade.triggerOrderType) {
      return `${toFixedWorklet(abs(mulWorklet(divWorklet(trade.fillStartSize, trade.size), 100)), 0)}%`;
    }

    return formatCurrency(mulWorklet(trade.size, trade.price), {
      useCompactNotation: false,
    });
  }, [trade]);

  const pnl = useMemo(() => {
    return `${isPositivePnl ? '+' : ''} ${formatCurrency(trade.netPnl)}`;
  }, [trade.netPnl, isPositivePnl]);

  const formattedPrice = useMemo(() => {
    return formatPerpAssetPrice(trade.price);
  }, [trade.price]);

  const isLiquidation =
    trade.description === tradeExecutionDescriptions.longLiquidated || trade.description === tradeExecutionDescriptions.shortLiquidated;
  const descriptionColor = isLiquidation ? 'red' : 'labelTertiary';
  const descriptionIcon = descriptionIcons[trade.description as keyof typeof descriptionIcons];

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={10}>
      {showMarketIcon && <HyperliquidTokenIcon size={36} symbol={trade.symbol} />}

      <Box paddingVertical={'16px'} gap={12} style={styles.flex}>
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Box flexDirection="row" alignItems="center" gap={2}>
            <TextIcon color={descriptionColor} height={8} size="icon 11px" weight="semibold" width={18}>
              {descriptionIcon}
            </TextIcon>
            <Text size="13pt" weight="semibold" color={descriptionColor}>
              {trade.description}
            </Text>
          </Box>
          <Text align="right" size="13pt" color="labelQuaternary" weight="medium">
            {formattedDate}
          </Text>
        </Box>

        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text size="17pt" color="label" weight="semibold">
            {leftHandSide}
            <Text size="17pt" color="labelQuaternary" weight="semibold">
              {`${LARGE_SPACE}@${LARGE_SPACE}`}
            </Text>
            {formattedPrice}
          </Text>
          {pnlValue !== 0 && (
            <Text align="right" size="17pt" weight="semibold" color={pnlColor}>
              {pnl}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
