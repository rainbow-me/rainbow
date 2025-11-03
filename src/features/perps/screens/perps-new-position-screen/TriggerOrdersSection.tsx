import { Box } from '@/design-system';
import React, { useMemo } from 'react';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { TriggerOrderCard } from '@/features/perps/components/TriggerOrderCard';
import { PerpPositionSide, TriggerOrderSource, TriggerOrderType } from '@/features/perps/types';
import { AddTriggerOrderButton } from '@/features/perps/components/AddTriggerOrderButton';
import Animated from 'react-native-reanimated';
import { LAYOUT_ANIMATION } from '@/features/perps/constants';
import { estimatePnl } from '@/features/perps/utils/estimatePnl';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { mulWorklet } from '@/safe-math/SafeMath';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';

export const TriggerOrdersSection = function TriggerOrdersSection() {
  const market = useHlNewPositionStore(state => state.market);
  const triggerOrders = useHlNewPositionStore(state => state.triggerOrders);
  const amount = useHlNewPositionStore(state => state.amount);
  const leverage = useHlNewPositionStore(state => state.leverage);
  const positionSide = useHlNewPositionStore(state => state.positionSide);

  const liveEntryPrice = useLiveTokenValue({
    tokenId: getHyperliquidTokenId(market?.symbol),
    initialValue: market?.midPrice ?? market?.price ?? '0',
    selector: state => state.midPrice ?? state.price,
  });

  const projectedPnlById = useMemo(() => {
    if (!market || !leverage) return {};
    const isLong = positionSide === PerpPositionSide.LONG;

    return triggerOrders.reduce(
      (acc, order) => {
        const estimatedPnl = estimatePnl({
          entryPrice: liveEntryPrice,
          exitPrice: order.price,
          margin: amount,
          leverage,
          isLong,
          includeFees: false,
        });

        const fraction = order.orderFraction ?? '1';
        const pnlForFraction = fraction === '1' ? estimatedPnl : mulWorklet(estimatedPnl, fraction);
        acc[order.localId] = formatCurrency(pnlForFraction);
        return acc;
      },
      {} as Record<string, string>
    );
  }, [amount, liveEntryPrice, leverage, market, positionSide, triggerOrders]);

  if (!market) return null;

  const hasExistingTakeProfit = triggerOrders.some(order => order.type === TriggerOrderType.TAKE_PROFIT);
  const hasExistingStopLoss = triggerOrders.some(order => order.type === TriggerOrderType.STOP_LOSS);

  return (
    <Box width="full" gap={20}>
      {triggerOrders.length > 0 && (
        <Box gap={12}>
          {triggerOrders.map(triggerOrder => (
            <TriggerOrderCard
              key={triggerOrder.localId}
              type={triggerOrder.type}
              price={triggerOrder.price}
              percentage={`${Number(triggerOrder.orderFraction) * 100}%`}
              projectedPnl={projectedPnlById[triggerOrder.localId] ?? '-'}
              onPressDelete={() => {
                hlNewPositionStoreActions.removeTriggerOrder(triggerOrder.localId);
              }}
            />
          ))}
        </Box>
      )}
      <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={12}>
        <AddTriggerOrderButton
          symbol={market.symbol}
          type={TriggerOrderType.TAKE_PROFIT}
          source={TriggerOrderSource.NEW}
          disabled={hasExistingTakeProfit}
        />
        <AddTriggerOrderButton
          symbol={market.symbol}
          type={TriggerOrderType.STOP_LOSS}
          source={TriggerOrderSource.NEW}
          disabled={hasExistingStopLoss}
        />
      </Box>
    </Box>
  );
};
