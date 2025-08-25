import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { BaseToastIcon } from '@/components/rainbow-toast/icons/BaseToastIcon';
import { isWideSwapIcon, SwapToastIcon } from '@/components/rainbow-toast/icons/SwapToastIcon';
import { getSwapToastNetworkLabel, getToastTitle } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToast } from '@/components/rainbow-toast/types';
import Spinner from '@/components/Spinner';
import { Text } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { activityValues, useTransactionLaunchToken } from '@/helpers/transactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import React, { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SendToastIcon } from './icons/SendToastIcon';
import { useToastColors } from './useToastColors';

const EXPANDED_ICON_SIZE = 34;

export function ToastExpandedContent({ toast }: { toast: RainbowToast }) {
  if (toast.transaction.type === 'swap') {
    return <SwapToastExpandedContent toast={toast} />;
  }
  if (toast.transaction.type === 'send') {
    return <SendToastExpandedContent toast={toast} />;
  }

  return <BaseToastExpandedContent toast={toast} />;
}

function BaseToastExpandedContent({ toast }: { toast: RainbowToast }) {
  const { transaction } = toast;
  const launchToken = useTransactionLaunchToken(transaction);
  const icon = <BaseToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />;
  const title = launchToken?.name || transaction.contract?.name || transaction.description;
  const subtitle = getToastTitle(toast);
  const isLoading = transaction.status === TransactionStatus.pending;
  return <ToastExpandedContentDisplay isLoading={isLoading} icon={icon} label={title} statusLabel={subtitle} transaction={transaction} />;
}

function SendToastExpandedContent({ toast }: { toast: RainbowToast }) {
  const { transaction } = toast;
  const title = transaction.asset?.symbol || transaction.symbol || '';
  const isLoading = transaction.status === TransactionStatus.pending;
  const subtitle = getToastTitle(toast);

  return (
    <ToastExpandedContentDisplay
      isLoading={isLoading}
      icon={<SendToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />}
      statusLabel={subtitle}
      label={title}
      transaction={transaction}
    />
  );
}

function SwapToastExpandedContent({ toast }: { toast: RainbowToast }) {
  const { transaction } = toast;

  const title = getSwapToastNetworkLabel(toast);
  const subtitle = getToastTitle(toast);
  const isLoading = transaction.status === TransactionStatus.pending;
  const isWideIcon = isWideSwapIcon(toast);

  return (
    <ToastExpandedContentDisplay
      isLoading={isLoading}
      icon={<SwapToastIcon size={isWideIcon ? TOAST_ICON_SIZE - 3 : EXPANDED_ICON_SIZE} toast={toast} />}
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
    return '';
  })();

  return (
    <View style={styles.container}>
      <View style={styles.iconSection}>
        <View style={styles.iconWrapper}>{icon}</View>
      </View>

      <View style={styles.mainSection}>
        <View style={styles.topRow}>
          <View style={styles.statusText}>
            {isLoading ? <Spinner color={colors.loadingText} size={11} style={styles.spinnerStyle} /> : null}
            <Text color={isLoading ? { custom: colors.loadingText } : 'labelTertiary'} size="13pt" weight="semibold">
              {statusLabel}
            </Text>
          </View>

          <Text
            style={styles.topInfoText}
            ellipsizeMode="tail"
            numberOfLines={1}
            color={{ custom: colors.foregroundDim }}
            size="13pt"
            weight="medium"
          >
            {topValue || ''}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.labelText} numberOfLines={1} ellipsizeMode="tail" color="label" size="17pt" weight="medium">
            {label}
          </Text>

          <Text
            style={styles.bottomInfoText}
            ellipsizeMode="tail"
            numberOfLines={1}
            color="labelSecondary"
            size="15pt"
            weight="medium"
            align="right"
          >
            {bottomValueWithoutSymbol || ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 22,
    flex: 1,
  },
  iconSection: {
    width: EXPANDED_ICON_SIZE,
    height: EXPANDED_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: EXPANDED_ICON_SIZE,
    height: EXPANDED_ICON_SIZE,
  },
  mainSection: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 4,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
  },
  bottomInfoText: {
    flex: 1,
    // visually adjusting for line height difference
    transform: [{ translateY: 0.5 }],
  },
  statusText: {
    flexDirection: 'row',
    marginRight: 16,
    minHeight: 16,
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  topInfoText: { flex: 1, textAlign: 'right' },
  labelText: {
    lineHeight: 28,
    marginRight: 10,
    maxWidth: '70%',
  },
  valueSection: {
    maxWidth: '38%',
    flexDirection: 'column',
    minHeight: '100%',
    justifyContent: 'space-between',
    marginVertical: -4,
  },
  spinnerStyle: {
    marginTop: -1,
    paddingRight: 5,
  },
});
