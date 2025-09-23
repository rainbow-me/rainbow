import { Box, Text } from '@/design-system';
import React from 'react';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { TriggerOrderCard } from '@/features/perps/components/TriggerOrderCard';
import { TriggerOrderType } from '@/features/perps/types';
import { AddTriggerOrderButton } from '@/features/perps/components/AddTriggerOrderButton';

export const TriggerOrdersSection = function TriggerOrdersSection() {
  const market = useHlNewPositionStore(state => state.market);
  const triggerOrders = useHlNewPositionStore(state => state.triggerOrders);

  if (!market) return null;

  return (
    <Box width="full" gap={20}>
      <Box gap={20}>
        <Box paddingHorizontal={'8px'}>
          <Text size="20pt" weight="bold" color="labelSecondary">
            {'Orders'}
          </Text>
        </Box>
        <Box gap={12}>
          <AddTriggerOrderButton symbol={market.symbol} type={TriggerOrderType.TAKE_PROFIT} source="newPosition" />
          <AddTriggerOrderButton symbol={market.symbol} type={TriggerOrderType.STOP_LOSS} source="newPosition" />
        </Box>
      </Box>
      <Box gap={12}>
        {triggerOrders.map(triggerOrder => (
          <TriggerOrderCard
            key={triggerOrder.localId}
            type={triggerOrder.type}
            price={triggerOrder.price}
            percentage={`${Number(triggerOrder.orderFraction) * 100}%`}
            onPressDelete={() => {
              hlNewPositionStoreActions.removeTriggerOrder(triggerOrder.localId);
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
