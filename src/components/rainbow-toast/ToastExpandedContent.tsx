import { ToastExpandedAfterTransaction } from '@/components/rainbow-toast/ToastExpandedAfterTransaction';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import Spinner from '@/components/Spinner';
import { Text } from '@/design-system';
import { RainbowTransaction } from '@/entities';
import React, { ReactNode } from 'react';
import { View } from 'react-native';

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
        paddingHorizontal: 26,
        paddingVertical: 16,
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
          gap: 12,
          // visually this looks a bit better being slightly up due to the smaller top title text
          marginTop: -1,
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          {isLoading ? <Spinner color={colors.loadingText} size={11} style={{ marginTop: -1, paddingRight: 5 }} /> : null}
          <Text color={isLoading ? { custom: colors.loadingText } : 'labelTertiary'} size="13pt" weight="semibold">
            {statusLabel}
          </Text>
        </View>
        <Text color="label" size="17pt" weight="medium">
          {label}
        </Text>
      </View>

      <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
        <ToastExpandedAfterTransaction transaction={transaction} />
      </View>
    </View>
  );
}
