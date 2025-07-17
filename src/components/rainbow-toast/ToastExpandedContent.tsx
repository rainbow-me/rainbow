import { activityValues } from '@/components/coin-row/FastTransactionCoinRow';
import Spinner from '@/components/Spinner';
import { Text } from '@/design-system';
import { RainbowTransaction } from '@/entities';
import { returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useToastColors } from './useToastColors';

type Props = {
  icon: ReactNode;
  statusLabel: ReactNode;
  transaction: RainbowTransaction;
  label: ReactNode;
  iconWidth?: number;
  isLoading?: boolean;
};

export const EXPANDED_ICON_SIZE = 34;

export function ToastExpandedContent({ icon, statusLabel, label, transaction, isLoading }: Props) {
  const colors = useToastColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 24,
        alignItems: 'center',
        overflow: 'hidden',
        paddingHorizontal: 28,
        paddingVertical: 16,
        flex: 1,
      }}
    >
      <View
        style={{
          width: EXPANDED_ICON_SIZE + 12,
          height: EXPANDED_ICON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: EXPANDED_ICON_SIZE,
            height: EXPANDED_ICON_SIZE,
          }}
        >
          {icon}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        <View
          style={{
            flex: 10,
            gap: 13,
            // visually this looks a bit better being slightly up due to the smaller top title text
            marginTop: -1,
          }}
        >
          <View style={{ flexDirection: 'row', flex: 1, minHeight: 14, alignItems: 'center', flexWrap: 'nowrap' }}>
            {isLoading ? <Spinner color={colors.loadingText} size={11} style={{ marginTop: -1, paddingRight: 5 }} /> : null}
            <Text color={isLoading ? { custom: colors.loadingText } : 'labelTertiary'} size="13pt" weight="semibold">
              {statusLabel}
            </Text>
          </View>

          <Text numberOfLines={1} ellipsizeMode="tail" color="label" size="17pt" weight="medium">
            {label}
          </Text>
        </View>

        <ToastExpandedAfterTransaction transaction={transaction} />
      </View>
    </View>
  );
}

function ToastExpandedAfterTransaction({ transaction }: { transaction: RainbowTransaction }) {
  const colors = useToastColors();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const [topValue, bottomValueIn] = activityValues(transaction, nativeCurrency) ?? [];
  const bottomValueWithoutSymbol = bottomValueIn
    ?.trim()
    .split(' ')
    .map(part => (returnStringFirstEmoji(part) ? '' : part))
    .filter(Boolean)
    .join(' ');

  return (
    <View style={{ maxWidth: '33%', flexDirection: 'column', minHeight: '100%', gap: 12, marginVertical: -4 }}>
      <Text ellipsizeMode="tail" numberOfLines={1} color={{ custom: colors.foregroundDim }} size="13pt" weight="medium">
        {topValue || 'Pending'}
      </Text>
      <Text ellipsizeMode="tail" numberOfLines={1} color={{ custom: colors.foreground }} size="15pt" weight="medium" align="right">
        {bottomValueWithoutSymbol || '0 ETH'}
      </Text>
    </View>
  );
}
