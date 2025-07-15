import { activityValues } from '@/components/coin-row/FastTransactionCoinRow';
import { Text } from '@/design-system';
import { RainbowTransaction } from '@/entities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import React from 'react';
import { View } from 'react-native';
import { useToastColors } from './useToastColors';

export function ToastExpandedAfterTransaction({ transaction }: { transaction: RainbowTransaction }) {
  const colors = useToastColors();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const [topValue, bottomValue] = activityValues(transaction, nativeCurrency) ?? [];

  return (
    <View style={{ flexDirection: 'column', minHeight: '100%' }}>
      <Text color={{ custom: colors.foregroundDim }} size="13pt" weight="medium">
        {topValue}
      </Text>
      <Text color="label" size="15pt" weight="medium">
        {bottomValue}
      </Text>
    </View>
  );
}
