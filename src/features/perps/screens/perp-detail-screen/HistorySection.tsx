import { Fragment, memo, useMemo, useState } from 'react';
import { HlTrade, PerpMarket, TradeExecutionType } from '@/features/perps/types';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { tradeExecutionDescriptions, useHlTradesStore } from '@/features/perps/stores/hlTradesStore';
import { Box, BoxProps, Separator, Text, TextIcon, TextShadow } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { format } from 'date-fns';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import * as i18n from '@/languages';
import { abs } from '@/helpers/utilities';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

const DEFAULT_VISIBLE_TRADE_COUNT = 10;
const LARGE_SPACE = ' ';

const descriptionIcons = {
  [TradeExecutionType.LONG_LIQUIDATED]: '􀁞',
  [TradeExecutionType.SHORT_LIQUIDATED]: '􀁞',
  [TradeExecutionType.LONG_OPENED]: '􀁌',
  [TradeExecutionType.SHORT_OPENED]: '􀁌',
  [TradeExecutionType.LONG_CLOSED]: '􀁎',
  [TradeExecutionType.SHORT_CLOSED]: '􀁎',
  [TradeExecutionType.TAKE_PROFIT_EXECUTED]: '􀑁',
  [TradeExecutionType.STOP_LOSS_EXECUTED]: '􁘳',
};

const TradeListItem = memo(function TradeListItem({ paddingTop = '16px', trade }: { paddingTop?: BoxProps['paddingTop']; trade: HlTrade }) {
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

  const isLiquidation =
    trade.description === tradeExecutionDescriptions.longLiquidated || trade.description === tradeExecutionDescriptions.shortLiquidated;
  const descriptionColor = isLiquidation ? 'red' : 'labelTertiary';
  const descriptionIcon = descriptionIcons[trade.executionType];

  return (
    <Box paddingBottom="16px" paddingTop={paddingTop} gap={12}>
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
          {formatPerpAssetPrice(trade.price)}
        </Text>
        {pnlValue !== 0 && (
          <Text align="right" size="17pt" weight="semibold" color={pnlColor}>
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
  const historyData = useHlTradesStore(state => state.getTradesBySymbol());

  const trades = historyData?.[market.symbol];

  if (!trades?.length) {
    return (
      <Box alignItems="center" justifyContent="center" paddingVertical="28px">
        <Text color="labelQuaternary" size="17pt" weight="heavy">
          {i18n.t(i18n.l.perps.history.no_trades)}
        </Text>
      </Box>
    );
  }

  const visibleTrades = isExpanded ? trades : trades.slice(0, DEFAULT_VISIBLE_TRADE_COUNT);

  return (
    <Box gap={16}>
      {(isExpanded || trades.length > 0) && (
        <Box gap={12}>
          <Box>
            {visibleTrades.map((trade, index) => (
              <Fragment key={trade.id}>
                <ButtonPressAnimation onPress={() => Navigation.handleAction(Routes.PERPS_TRADE_DETAILS_SHEET, { trade })}>
                  <TradeListItem paddingTop={index === 0 ? '10px' : '16px'} trade={trade} />
                </ButtonPressAnimation>
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
                    {i18n.t(i18n.l.perps.common.more)}
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
