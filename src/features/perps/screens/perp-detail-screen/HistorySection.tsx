import { memo, useMemo, useState } from 'react';
import { HlTrade, PerpMarket } from '@/features/perps/types';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { useHlTradesStore } from '@/features/perps/stores/hlTradesStore';
import { Box, Text } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { divWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { format } from 'date-fns';

const TradeListItem = memo(function TradeListItem({ trade, isLast }: { trade: HlTrade; isLast: boolean }) {
  const pnlValue = parseFloat(trade.pnl);
  const pnlColor = pnlValue >= 0 ? 'green' : 'red';

  const formattedDate = useMemo(() => {
    return format(trade.executedAt, 'MMM d, HH:mm');
  }, [trade.executedAt]);

  const leftHandSide = useMemo(() => {
    if (trade.triggerOrderType) {
      return `${toFixedWorklet(divWorklet(trade.fillStartSize, trade.size), 2)}%`;
    }

    // TODO: KANE
    return formatAssetPrice({ value: '0', currency: 'USD' });
  }, [trade.fillStartSize, trade.size, trade.triggerOrderType]);

  return (
    <>
      <Box paddingVertical="16px" gap={12}>
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Box flexDirection="row" gap={8} alignItems="center">
            <Text size="13pt" weight="semibold" color="labelTertiary">
              {trade.description}
            </Text>
          </Box>
          <Text size="13pt" color="labelQuaternary" weight="medium">
            {formattedDate}
          </Text>
        </Box>

        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text size="17pt" color="white" weight="semibold">
            {leftHandSide}{' '}
            <Text size="17pt" color="labelTertiary" weight="semibold">
              @
            </Text>{' '}
            {formatAssetPrice({ value: trade.price, currency: 'USD' })}
          </Text>
          {pnlValue !== 0 && (
            <Text size="17pt" weight="semibold" color={pnlColor}>
              {pnlValue >= 0 ? '+' : ''}
              {formatAssetPrice({ value: trade.pnl, currency: 'USD' })}
            </Text>
          )}
        </Box>
      </Box>

      {!isLast && <Box backgroundColor="#F5F8FF06" height={{ custom: 1.33 }} width="full" />}
    </>
  );
});

export const HistorySection = memo(function HistorySection({ market }: { market: PerpMarket }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = usePerpsAccentColorContext();
  const historyData = useHlTradesStore(state => state.tradesBySymbol);

  const trades = historyData[market.symbol] || [];
  const visibleTrades = isExpanded ? trades : trades.slice(0, 3);

  if (trades.length === 0) {
    return (
      <Box>
        <Text weight="semibold" size="17pt" color="labelTertiary">
          No trades
        </Text>
      </Box>
    );
  }

  return (
    <Box gap={16}>
      {(isExpanded || trades.length > 0) && (
        <Box gap={12}>
          {visibleTrades.map((trade, index) => (
            <TradeListItem key={`${trade.id}-${index}`} trade={trade} isLast={index === visibleTrades.length - 1} />
          ))}

          {trades.length > 3 && !isExpanded && (
            <ButtonPressAnimation onPress={() => setIsExpanded(true)} scaleTo={0.98}>
              <Box
                backgroundColor="#192928"
                borderRadius={28}
                borderWidth={2}
                borderColor={{ custom: opacityWorklet('#3ECFAD', 0.06) }}
                padding="12px"
                alignItems="center"
              >
                <Text size="15pt" weight="semibold" color={{ custom: colors.accentColors.opacity56 }}>
                  More
                </Text>
              </Box>
            </ButtonPressAnimation>
          )}
        </Box>
      )}
    </Box>
  );
});
