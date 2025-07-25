import { activityValues } from '@/components/coin-row/FastTransactionCoinRow';
import { SWAP_ICON_WIDTH } from '@/components/rainbow-toast/constants';
import { ContractToastIcon } from '@/components/rainbow-toast/icons/ContractToastIcon';
import { SwapToastIcon } from '@/components/rainbow-toast/icons/SwapToastIcon';
import { getStatusLabel, getSwapToastNetworkLabel } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToast, RainbowToastContract, RainbowToastSend, RainbowToastSwap } from '@/components/rainbow-toast/types';
import Spinner from '@/components/Spinner';
import { Text } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import React, { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SendToastIcon } from './icons/SendToastIcon';
import { useToastColors } from './useToastColors';

const EXPANDED_ICON_SIZE = 34;

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
  const title = toast.name;
  const subtitle = getStatusLabel(toast);
  const isLoading = toast.status === TransactionStatus.pending || toast.status === TransactionStatus.contract_interaction;
  return (
    <ToastExpandedContentDisplay isLoading={isLoading} icon={icon} label={title} statusLabel={subtitle} transaction={toast.transaction} />
  );
}

function SendToastExpandedContent({ toast }: { toast: RainbowToastSend }) {
  const title = `${toast.token}`;
  const isLoading = toast.status === TransactionStatus.sending || toast.status === TransactionStatus.pending;
  const subtitle = getStatusLabel(toast);

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
  const subtitle = getStatusLabel(toast);
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
    <View style={styles.container}>
      <View style={styles.iconSection}>
        <View style={styles.iconWrapper}>{icon}</View>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.textSection}>
          <View style={styles.statusRow}>
            {isLoading ? <Spinner color={colors.loadingText} size={11} style={styles.spinnerStyle} /> : null}
            <Text color={isLoading ? { custom: colors.loadingText } : 'labelTertiary'} size="13pt" weight="semibold">
              {statusLabel}
            </Text>
          </View>

          <Text numberOfLines={1} ellipsizeMode="tail" color="label" size="17pt" weight="medium" style={styles.labelText}>
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
  const [topValueIn, bottomValueIn] = activityValues(transaction, nativeCurrency) ?? [];

  const bottomValueWithoutSymbol = useMemo(() => {
    return bottomValueIn
      ?.trim()
      .split(' ')
      .map(part => (returnStringFirstEmoji(part) ? '' : part))
      .filter(Boolean)
      .join(' ');
  }, [bottomValueIn]);

  const topValue = (() => {
    if (topValueIn) {
      return topValueIn;
    }
    if (transaction.type === 'send' && transaction.asset?.symbol && transaction.amount) {
      return `- ${transaction.amount} ${transaction.asset.symbol}`;
    }
    return '';
  })();

  return (
    <View style={styles.valueSection}>
      <Text ellipsizeMode="tail" numberOfLines={1} color={{ custom: colors.foregroundDim }} size="13pt" weight="medium">
        {topValue || ''}
      </Text>
      <Text ellipsizeMode="tail" numberOfLines={1} color={{ custom: colors.foreground }} size="15pt" weight="medium" align="right">
        {bottomValueWithoutSymbol || ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingVertical: 16,
    flex: 1,
  },
  iconSection: {
    width: EXPANDED_ICON_SIZE + 12,
    height: EXPANDED_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: EXPANDED_ICON_SIZE,
    height: EXPANDED_ICON_SIZE,
  },
  middleSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  textSection: {
    flex: 10,
    gap: 8,
    // visually this looks a bit better being slightly up due to the smaller top title text
    marginTop: -1,
  },
  statusRow: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 16,
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  labelText: {
    lineHeight: 28,
    marginTop: -10,
  },
  valueSection: {
    maxWidth: '38%',
    flexDirection: 'column',
    minHeight: '100%',
    gap: 12,
    marginVertical: -4,
  },
  spinnerStyle: {
    marginTop: -1,
    paddingRight: 5,
  },
});
