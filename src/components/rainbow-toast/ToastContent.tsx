import { allTransactionStatuses, SWAP_ICON_WIDTH, TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ContractToastIcon } from '@/components/rainbow-toast/icons/ContractToastIcon';
import { SendToastIcon } from '@/components/rainbow-toast/icons/SendToastIcon';
import { isWideSwapIcon, SwapToastIcon } from '@/components/rainbow-toast/icons/SwapToastIcon';
import { RainbowToast, RainbowToastContract, type RainbowToastSend, type RainbowToastSwap } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Text } from '@/design-system';
import { TransactionStatus } from '@/entities';
import * as i18n from '@/languages';
import React, { memo } from 'react';
import { Text as RNText, StyleSheet, View } from 'react-native';

type ToastContentProps = {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  iconWidth?: number;
  type?: 'error';
};

export const ToastContent = memo(function ToastContent({ toast }: { toast: RainbowToast }) {
  if (toast.type === 'swap') {
    return <SwapToastContent toast={toast} />;
  }
  if (toast.type === 'send') {
    return <SendToastContent toast={toast} />;
  }
  if (toast.type === 'contract') {
    return <ContractToastContent toast={toast} />;
  }
  return null;
});

// used by each toast type to display their inner contents
function ToastContentDisplay({ icon, title, subtitle, type, iconWidth = TOAST_ICON_SIZE }: ToastContentProps) {
  const colors = useToastColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            width: iconWidth,
            height: TOAST_ICON_SIZE,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.textContainer}>
        <Text color={{ custom: colors.foreground }} size="15pt" weight="bold" numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <Text
          color={{ custom: type === 'error' ? colors.red : colors.foreground }}
          size="13pt"
          weight="bold"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ opacity: type === 'error' ? 1 : 0.5 }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
    minWidth: 130,
  },
  iconContainer: {
    marginLeft: -2,
    flexShrink: 0,
  },
  textContainer: {
    gap: 9,
    minWidth: 100,
  },
  arrowSeparator: {
    fontWeight: '200',
  },
});

function SwapToastContent({ toast }: { toast: RainbowToastSwap }) {
  const title = getToastTitle(toast);
  const subtitle = getSwapToastNetworkLabel({ toast });
  return (
    <ToastContentDisplay
      iconWidth={isWideSwapIcon(toast) ? SWAP_ICON_WIDTH : TOAST_ICON_SIZE}
      type={toast.status === TransactionStatus.failed ? 'error' : undefined}
      icon={<SwapToastIcon toast={toast} />}
      title={title}
      subtitle={subtitle}
    />
  );
}

export const getSwapToastNetworkLabel = ({ toast }: { toast: RainbowToastSwap }) => {
  // using RNText because it can inherit the color/size from ToastContentDisplay
  return (
    <RNText>
      {toast.fromAssetSymbol} <RNText style={styles.arrowSeparator}>􀄫</RNText> {toast.toAssetSymbol}
    </RNText>
  );
};

function SendToastContent({ toast }: { toast: RainbowToastSend }) {
  const title = getToastTitle(toast);
  const subtitle = toast.displayAmount;

  return (
    <ToastContentDisplay
      key={toast.status}
      icon={<SendToastIcon toast={toast} />}
      title={title}
      subtitle={subtitle}
      type={toast.status === TransactionStatus.failed ? 'error' : undefined}
    />
  );
}

function ContractToastContent({ toast }: { toast: RainbowToastContract }) {
  const icon = <ContractToastIcon toast={toast} />;
  const title = getToastTitle(toast);
  const subtitle = toast.name;

  return (
    <ToastContentDisplay
      icon={icon}
      title={title}
      subtitle={subtitle}
      type={toast.status === TransactionStatus.failed ? 'error' : undefined}
    />
  );
}

export const getToastTitle = (toast: RainbowToast): string => {
  const isPending = toast.status === TransactionStatus.pending || toast.status === TransactionStatus.contract_interaction;
  // for swap/send we set the "pending" label to be the more active name, swapping/sending
  if (toast.type === 'swap' && isPending) {
    return allTransactionStatuses.swapping;
  }
  if (toast.type === 'send' && isPending) {
    return allTransactionStatuses.sending;
  }
  if (isPending) {
    // don't know "Contract Interaction" just show "Pending"
    return i18n.t(i18n.l.toasts.statuses.pending);
  }
  return allTransactionStatuses[toast.status] || i18n.t(i18n.l.toasts.statuses.pending);
};
