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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { AddTriggerOrderButton } from '@/features/perps/components/AddTriggerOrderButton';
import i18n from '@/languages';
import { LAYOUT_ANIMATION } from '@/features/perps/constants';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { analytics } from '@/analytics';
import { parseHyperliquidErrorMessage } from '@/features/perps/utils';

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
    if (!position) return;

    const perpsBalance = Number(useHyperliquidAccountStore.getState().getValue());

    setIsCancelling(true);
    try {
      await hyperliquidAccountActions.cancelOrder({
        orderId: order.id,
        symbol: order.symbol,
      });

      analytics.track(analytics.event.perpsTriggerOrderCanceled, {
        market: order.symbol,
        side: position.side,
        triggerOrderType: type,
        triggerPrice: Number(order.triggerPrice),
        perpsBalance,
        leverage: position.leverage,
        positionValue: Number(position.value),
      });
    } catch (e) {
      const errorMessage = parseHyperliquidErrorMessage(e);
      analytics.track(analytics.event.perpsTriggerOrderCancelFailed, {
        market: order.symbol,
        side: position.side,
        triggerOrderType: type,
        perpsBalance,
        errorMessage,
      });
      Alert.alert(i18n.perps.common.error(), i18n.perps.trigger_orders.cancel_failed());
      logger.error(new RainbowError('[ExistingTriggerOrderCard]: error cancelling order', e));
    } finally {
      setIsCancelling(false);
    }
  }, [order.symbol, order.id, order.triggerPrice, type, position]);

  return (
    <Animated.View
      entering={FadeIn.duration(TIMING_CONFIGS.fastFadeConfig.duration).easing(TIMING_CONFIGS.fastFadeConfig.easing)}
      exiting={FadeOut.duration(TIMING_CONFIGS.fastFadeConfig.duration).easing(TIMING_CONFIGS.fastFadeConfig.easing)}
    >
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
          {i18n.perps.trigger_orders.title()}
        </Text>
      </Inline>
      {triggerOrders?.length ? (
        <Box gap={12}>
          {triggerOrders.map(order => (
            <ExistingTriggerOrderCard key={order.id} order={order} />
          ))}
        </Box>
      ) : null}
      <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={12}>
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
  );
});
