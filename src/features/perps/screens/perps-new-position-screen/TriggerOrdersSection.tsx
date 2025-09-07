import { Box, Text, TextShadow } from '@/design-system';
import React, { useCallback } from 'react';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { TriggerOrderCard } from '@/features/perps/components/TriggerOrderCard';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { TriggerOrderType } from '@/features/perps/types';

export const TriggerOrdersSection = function TriggerOrdersSection() {
  const market = useHlNewPositionStore(state => state.market);
  const { accentColors } = usePerpsAccentColorContext();
  const triggerOrders = useHlNewPositionStore(state => state.triggerOrders);
  const hasTakeProfit = triggerOrders.some(order => order.type === TriggerOrderType.TAKE_PROFIT);
  const hasStopLoss = triggerOrders.some(order => order.type === TriggerOrderType.STOP_LOSS);

  const navigateToTriggerOrderSheet = useCallback(
    (triggerOrderType: TriggerOrderType) => {
      Navigation.handleAction(Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET, {
        triggerOrderType,
        // TODO (kane): fix
        market: market!,
      });
    },
    [market]
  );

  return (
    <Box width="full" gap={20}>
      <Box gap={20}>
        <Box paddingHorizontal={'8px'}>
          <Text size="20pt" weight="bold" color="labelSecondary">
            {'Orders'}
          </Text>
        </Box>
        <Box gap={12}>
          <ButtonPressAnimation
            onPress={() => {
              navigateToTriggerOrderSheet(TriggerOrderType.TAKE_PROFIT);
            }}
            disabled={hasTakeProfit}
          >
            <Box
              borderWidth={2}
              borderColor={{ custom: accentColors.opacity8 }}
              justifyContent="center"
              alignItems="center"
              padding={'20px'}
              borderRadius={28}
              backgroundColor={accentColors.opacity8}
              style={{ opacity: hasTakeProfit ? 0.5 : 1 }}
            >
              <TextShadow blur={8} shadowOpacity={0.2}>
                <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
                  {'Add Take Profit 􀅼'}
                </Text>
              </TextShadow>
            </Box>
          </ButtonPressAnimation>
          <ButtonPressAnimation
            onPress={() => {
              navigateToTriggerOrderSheet(TriggerOrderType.STOP_LOSS);
            }}
            disabled={hasStopLoss}
          >
            <Box
              borderWidth={2}
              borderColor={{ custom: accentColors.opacity8 }}
              justifyContent="center"
              alignItems="center"
              padding={'20px'}
              borderRadius={28}
              backgroundColor={accentColors.opacity8}
              style={{ opacity: hasStopLoss ? 0.5 : 1 }}
            >
              <TextShadow blur={8} shadowOpacity={0.2}>
                <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
                  {'Add Stop Loss 􀅼'}
                </Text>
              </TextShadow>
            </Box>
          </ButtonPressAnimation>
        </Box>
      </Box>
      <Box gap={12}>
        {triggerOrders.map(triggerOrder => (
          <TriggerOrderCard
            key={triggerOrder.localId}
            type={triggerOrder.type}
            price={triggerOrder.price}
            percentage={`${triggerOrder.orderFraction}%`}
            onPressDelete={() => {
              hlNewPositionStoreActions.removeTriggerOrder(triggerOrder.localId);
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
