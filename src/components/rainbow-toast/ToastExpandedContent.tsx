import { activityValues } from '@/components/coin-row/FastTransactionCoinRow';
import { SWAP_ICON_WIDTH } from '@/components/rainbow-toast/constants';
import { ContractToastIcon } from '@/components/rainbow-toast/icons/ContractToastIcon';
import { SwapToastIcon } from '@/components/rainbow-toast/icons/SwapToastIcon';
import {
  getContractToastStatusLabel,
  getSendToastStatusLabel,
  getSwapToastNetworkLabel,
  getSwapToastStatusLabel,
} from '@/components/rainbow-toast/ToastContent';
import { SendToastIcon } from './icons/SendToastIcon';
import type { RainbowToast, RainbowToastContract, RainbowToastSend, RainbowToastSwap } from '@/components/rainbow-toast/types';
import Spinner from '@/components/Spinner';
import { Text } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { useToastColors } from './useToastColors';

export function ToastExpandedContent({ toast }: { toast: RainbowToast }) {
  if (toast.type === 'swap') {
    return <SwapToastExpandedContent toast={toast} />;
  }
  if (toast.type === 'send') {
    return <SendToastExpandedContent toast={toast} />;
  }
  if (toast.type === 'contract') {
    return <ContractToastExpandedContent toast={toast} />;
  }
  return null;
}

function ContractToastExpandedContent({ toast }: { toast: RainbowToastContract }) {
  const icon = <ContractToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />;
  const title = getContractToastStatusLabel(toast);
  const subtitle = toast.name;
  return <ToastExpandedContentDisplay icon={icon} label={title} statusLabel={subtitle} transaction={toast.transaction} />;
}

function SendToastExpandedContent({ toast }: { toast: RainbowToastSend }) {
  const title = `${toast.token}`;
  const isLoading = toast.status === TransactionStatus.sending || toast.status === TransactionStatus.pending;
  const subtitle = getSendToastStatusLabel(toast);

  return (
    <ToastExpandedContentDisplay
      isLoading={isLoading}
      icon={<SendToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />}
      statusLabel={subtitle}
      label={title}
      transaction={toast.transaction}
    />
  );
}

function SwapToastExpandedContent({ toast }: { toast: RainbowToastSwap }) {
  const { transaction } = toast;

  const title = getSwapToastNetworkLabel({ toast });
  const subtitle = getSwapToastStatusLabel({ toast });
  const isSwapped = toast.status === TransactionStatus.swapped;
  const isLoading = toast.status === TransactionStatus.swapping || toast.status === TransactionStatus.pending;

  return (
    <ToastExpandedContentDisplay
      isLoading={isLoading}
      icon={
        <View style={{ marginLeft: isSwapped ? 0 : -(SWAP_ICON_WIDTH - EXPANDED_ICON_SIZE) / 2 }}>
          <SwapToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />
        </View>
      }
      statusLabel={subtitle}
      label={title}
      transaction={transaction}
    />
  );
}

export const EXPANDED_ICON_SIZE = 34;

function ToastExpandedContentDisplay({
  icon,
  statusLabel,
  label,
  transaction,
  isLoading,
}: {
  icon: ReactNode;
  statusLabel: ReactNode;
  transaction: RainbowTransaction;
  label: ReactNode;
  iconWidth?: number;
  isLoading?: boolean;
}) {
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
            gap: 8,
            // visually this looks a bit better being slightly up due to the smaller top title text
            marginTop: -1,
          }}
        >
          <View style={{ flexDirection: 'row', flex: 1, minHeight: 16, alignItems: 'center', flexWrap: 'nowrap' }}>
            {isLoading ? <Spinner color={colors.loadingText} size={11} style={{ marginTop: -1, paddingRight: 5 }} /> : null}
            <Text color={isLoading ? { custom: colors.loadingText } : 'labelTertiary'} size="13pt" weight="semibold">
              {statusLabel}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            color="label"
            size="17pt"
            weight="medium"
            style={{
              lineHeight: 28,
              marginTop: -10,
            }}
          >
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
