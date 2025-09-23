import { Box, Text } from '@/design-system';
import React from 'react';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { TriggerOrderCard } from '@/features/perps/components/TriggerOrderCard';
import { TriggerOrderSource, TriggerOrderType } from '@/features/perps/types';
import { AddTriggerOrderButton } from '@/features/perps/components/AddTriggerOrderButton';
import Animated from 'react-native-reanimated';
import { LAYOUT_ANIMATION } from '@/features/perps/constants';

export const TriggerOrdersSection = function TriggerOrdersSection() {
  const market = useHlNewPositionStore(state => state.market);
  const triggerOrders = useHlNewPositionStore(state => state.triggerOrders);

  if (!market) return null;

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
              onPressDelete={() => {
                hlNewPositionStoreActions.removeTriggerOrder(triggerOrder.localId);
              }}
            />
          ))}
        </Box>
      )}
      <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={20}>
        <Box paddingHorizontal={'8px'}>
          <Text size="20pt" weight="bold" color="labelSecondary">
            {'Orders'}
          </Text>
        </Box>
        <Box gap={12}>
          <AddTriggerOrderButton symbol={market.symbol} type={TriggerOrderType.TAKE_PROFIT} source={TriggerOrderSource.NEW} />
          <AddTriggerOrderButton symbol={market.symbol} type={TriggerOrderType.STOP_LOSS} source={TriggerOrderSource.NEW} />
        </Box>
      </Box>
    </Box>
  );
};
