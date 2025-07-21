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
import { Text as RNText, View } from 'react-native';

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
    <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center', minWidth: 130 }}>
      <View
        style={{
          width: iconWidth,
          // the ciruclar icons look further from the left edge than the text
          // looks from the right edge, so adjusting it visually a bit here
          marginLeft: -2,
          height: TOAST_ICON_SIZE,
          flexShrink: 0,
        }}
      >
        {icon}
      </View>

      <View style={{ gap: 9, minWidth: 100 }}>
        <Text color={{ custom: colors.foreground }} size="15pt" weight="bold" numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <Text
          color={{ custom: type === 'error' ? colors.red : colors.foreground }}
          size="13pt"
          weight="bold"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ opacity: 0.5 }}
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
  return (
    <RNText>
      {toast.fromAssetSymbol} <RNText style={{ fontWeight: '200' }}>􀄫</RNText> {toast.toAssetSymbol}
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

export function SendToastContent({ toast }: { toast: RainbowToastSend }) {
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

export const getContractToastStatusLabel = (toast: RainbowToastContract) => {
  if (toast.status === TransactionStatus.minted) {
    return i18n.t(i18n.l.toasts.contract.minted);
  }
  if (toast.status === TransactionStatus.minting) {
    return i18n.t(i18n.l.toasts.contract.minting);
  }
  if (toast.status === TransactionStatus.failed) {
    return i18n.t(i18n.l.toasts.contract.failed);
  }
  return i18n.t(i18n.l.toasts.contract.pending);
};

export function ContractToastContent({ toast }: { toast: RainbowToastContract }) {
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
