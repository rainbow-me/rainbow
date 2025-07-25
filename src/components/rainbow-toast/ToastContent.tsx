import { SWAP_ICON_WIDTH, TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ContractToastIcon } from '@/components/rainbow-toast/icons/ContractToastIcon';
import { SendToastIcon } from '@/components/rainbow-toast/icons/SendToastIcon';
import { isWideSwapIcon, SwapToastIcon } from '@/components/rainbow-toast/icons/SwapToastIcon';
import { RainbowToast, RainbowToastContract, type RainbowToastSend, type RainbowToastSwap } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Text } from '@/design-system';
import { TransactionStatus } from '@/entities';
import * as i18n from '@/languages';
import React from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

interface ToastContentProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  iconWidth?: number;
  type?: 'error';
}

export function ToastContent({ toast }: { toast: RainbowToast }) {
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
}

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

function SwapToastContent({ toast }: { toast: RainbowToastSwap }) {
  const title = getSwapToastStatusLabel({ toast });
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

export const getSwapToastStatusLabel = ({ toast }: { toast: RainbowToastSwap }) => {
  if (toast.status === TransactionStatus.failed) {
    return i18n.t(i18n.l.toasts.swap.failed);
  }
  if (toast.status === TransactionStatus.swapped || toast.status === TransactionStatus.confirmed) {
    return i18n.t(i18n.l.toasts.swap.swapped);
  }
  return i18n.t(i18n.l.toasts.swap.swapping);
};

export const getSwapToastNetworkLabel = ({ toast }: { toast: RainbowToastSwap }) => {
  // using RNText because it can inherit the color/size from ToastContentDisplay
  return (
    <RNText>
      {toast.fromAssetSymbol} <RNText style={styles.arrowSeparator}>􀄫</RNText> {toast.toAssetSymbol}
    </RNText>
  );
};

export const getSendToastStatusLabel = (toast: RainbowToastSend) => {
  if (toast.status === TransactionStatus.sent || toast.status === TransactionStatus.confirmed) {
    return i18n.t(i18n.l.toasts.send.sent);
  }
  if (toast.status === TransactionStatus.failed) {
    return i18n.t(i18n.l.toasts.send.failed);
  }
  return i18n.t(i18n.l.toasts.send.sending);
};

function SendToastContent({ toast }: { toast: RainbowToastSend }) {
  const title = getSendToastStatusLabel(toast);
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

// note: the only transactions not in here are "self"
export const getContractToastStatusLabel = (toast: RainbowToastContract) => {
  if (toast.status === TransactionStatus.minted) {
    return i18n.t(i18n.l.toasts.contract.minted);
  }
  if (toast.status === TransactionStatus.minting) {
    return i18n.t(i18n.l.toasts.contract.minting);
  }
  if (toast.status === TransactionStatus.swapped) {
    return i18n.t(i18n.l.toasts.swap.swapped);
  }
  if (toast.status === TransactionStatus.swapping) {
    return i18n.t(i18n.l.toasts.swap.swapping);
  }
  if (toast.status === TransactionStatus.failed) {
    return i18n.t(i18n.l.toasts.contract.failed);
  }
  if (toast.status === TransactionStatus.approved) {
    return i18n.t(i18n.l.toasts.contract.approved);
  }
  if (toast.status === TransactionStatus.approving) {
    return i18n.t(i18n.l.toasts.contract.approving);
  }
  if (toast.status === TransactionStatus.bridged) {
    return i18n.t(i18n.l.toasts.contract.bridged);
  }
  if (toast.status === TransactionStatus.bridging) {
    return i18n.t(i18n.l.toasts.contract.bridging);
  }
  if (toast.status === TransactionStatus.cancelled) {
    return i18n.t(i18n.l.toasts.contract.cancelling);
  }
  if (toast.status === TransactionStatus.deposited) {
    return i18n.t(i18n.l.toasts.contract.deposited);
  }
  if (toast.status === TransactionStatus.depositing) {
    return i18n.t(i18n.l.toasts.contract.depositing);
  }
  if (toast.status === TransactionStatus.dropped) {
    return i18n.t(i18n.l.toasts.contract.dropped);
  }
  if (toast.status === TransactionStatus.launched) {
    return i18n.t(i18n.l.toasts.contract.launched);
  }
  if (toast.status === TransactionStatus.launching) {
    return i18n.t(i18n.l.toasts.contract.launching);
  }
  if (toast.status === TransactionStatus.purchased) {
    return i18n.t(i18n.l.toasts.contract.purchased);
  }
  if (toast.status === TransactionStatus.purchasing) {
    return i18n.t(i18n.l.toasts.contract.purchasing);
  }
  if (toast.status === TransactionStatus.received) {
    return i18n.t(i18n.l.toasts.contract.received);
  }
  if (toast.status === TransactionStatus.receiving) {
    return i18n.t(i18n.l.toasts.contract.receiving);
  }
  if (toast.status === TransactionStatus.selling) {
    return i18n.t(i18n.l.toasts.contract.selling);
  }
  if (toast.status === TransactionStatus.sold) {
    return i18n.t(i18n.l.toasts.contract.sold);
  }
  if (toast.status === TransactionStatus.speeding_up) {
    return i18n.t(i18n.l.toasts.contract.speeding_up);
  }
  if (toast.status === TransactionStatus.withdrawing) {
    return i18n.t(i18n.l.toasts.contract.withdrawing);
  }
  if (toast.status === TransactionStatus.withdrew) {
    return i18n.t(i18n.l.toasts.contract.withdrew);
  }
  return i18n.t(i18n.l.toasts.contract.pending);
};

function ContractToastContent({ toast }: { toast: RainbowToastContract }) {
  const icon = <ContractToastIcon toast={toast} />;
  const title = getContractToastStatusLabel(toast);
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
