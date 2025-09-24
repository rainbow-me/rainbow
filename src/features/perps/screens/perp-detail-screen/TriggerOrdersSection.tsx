import React, { memo, useCallback, useState } from 'react';
import { Box, IconContainer, Inline, Text, TextShadow } from '@/design-system';
import { HlOpenOrder, useHlOpenOrdersStore } from '@/features/perps/stores/hlOpenOrdersStore';
import { TriggerOrderSource, TriggerOrderType } from '@/features/perps/types';
import { TriggerOrderCard } from '@/features/perps/components/TriggerOrderCard';
import { isZero } from '@/helpers/utilities';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { logger, RainbowError } from '@/logger';
import { Alert } from 'react-native';
import { hyperliquidAccountActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { AddTriggerOrderButton } from '@/features/perps/components/AddTriggerOrderButton';
import * as i18n from '@/languages';

type TriggerOrdersSectionProps = {
  symbol: string;
};

const ExistingTriggerOrderCard = memo(function ExistingTriggerOrderCard({ order }: { order: HlOpenOrder }) {
  const position = useHyperliquidAccountStore(state => state.getPosition(order.symbol));
  const [isCancelling, setIsCancelling] = useState(false);
  const isFullOrder = isZero(order.size);
  const percentage = isFullOrder
    ? '100%'
    : `${toFixedWorklet((Number(order.size) / (position?.size ? Math.abs(Number(position.size)) : Number(order.originalSize))) * 100, 2)}%`;
  const isTakeProfit = order.orderType === 'Take Profit Market' || order.orderType === 'Take Profit Limit';
  const type = isTakeProfit ? TriggerOrderType.TAKE_PROFIT : TriggerOrderType.STOP_LOSS;

  const onPressDelete = useCallback(async () => {
    setIsCancelling(true);
    try {
      await hyperliquidAccountActions.cancelOrder({
        orderId: order.id,
        symbol: order.symbol,
      });
    } catch (e) {
      Alert.alert(i18n.t(i18n.l.perps.common.error), i18n.t(i18n.l.perps.trigger_orders.cancel_failed));
      logger.error(new RainbowError('[ExistingTriggerOrderCard]: error cancelling order', e));
    } finally {
      setIsCancelling(false);
    }
  }, [order.symbol, order.id]);

  return (
    <Animated.View entering={FadeIn.duration(200).springify()} exiting={FadeOut.duration(150)}>
      <TriggerOrderCard
        type={type}
        price={order.triggerPrice}
        percentage={percentage}
        onPressDelete={onPressDelete}
        isCancelling={isCancelling}
      />
    </Animated.View>
  );
});

export const TriggerOrdersSection = memo(function TriggerOrdersSection({ symbol }: TriggerOrdersSectionProps) {
  const { accentColors } = usePerpsAccentColorContext();
  const orders = useHlOpenOrdersStore(data => data.getData()?.ordersBySymbol[symbol]);

  const triggerOrders = orders?.filter(order => order.triggerCondition !== null);
  const hasExistingTakeProfit =
    triggerOrders?.some(order => order.orderType === 'Take Profit Market' || order.orderType === 'Take Profit Limit') ?? false;
  const hasExistingStopLoss = triggerOrders?.some(order => order.orderType === 'Stop Market' || order.orderType === 'Stop Limit') ?? false;

  return (
    <Animated.View layout={LinearTransition.springify()}>
      <Box gap={28}>
        <Inline space="10px" alignVertical="center">
          <IconContainer height={14} width={24}>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text align="center" color={{ custom: accentColors.opacity100 }} size="icon 17px" weight="bold">
                {'􁣃'}
              </Text>
            </TextShadow>
          </IconContainer>
          <Text size="20pt" weight="heavy" color="label">
            {i18n.t(i18n.l.perps.trigger_orders.title)}
          </Text>
        </Inline>
        {triggerOrders?.length ? (
          <Box gap={12}>
            {triggerOrders.map(order => (
              <ExistingTriggerOrderCard key={order.id} order={order} />
            ))}
          </Box>
        ) : null}
        <Box gap={12}>
          <AddTriggerOrderButton
            symbol={symbol}
            type={TriggerOrderType.TAKE_PROFIT}
            source={TriggerOrderSource.EXISTING}
            disabled={hasExistingTakeProfit}
          />
          <AddTriggerOrderButton
            symbol={symbol}
            type={TriggerOrderType.STOP_LOSS}
            source={TriggerOrderSource.EXISTING}
            disabled={hasExistingStopLoss}
          />
        </Box>
      </Box>
    </Animated.View>
  );
});
