import { SWAP_ICON_WIDTH, TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { BaseToastIcon } from '@/components/rainbow-toast/icons/BaseToastIcon';
import { SendToastIcon } from '@/components/rainbow-toast/icons/SendToastIcon';
import { isWideSwapIcon, SwapToastIcon } from '@/components/rainbow-toast/icons/SwapToastIcon';
import { RainbowToast } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Text } from '@/design-system';
import { AssetType, TransactionStatus } from '@/entities';
import { useTransactionLaunchToken } from '@/helpers/transactions';
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
  if (toast.transaction.type === 'swap') {
    return <SwapToastContent toast={toast} />;
  }
  if (toast.transaction.type === 'send') {
    return <SendToastContent toast={toast} />;
  }

  return <BaseToastContent toast={toast} />;
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
        <Text
          style={{ flex: 1, marginBottom: -5 }}
          color={{ custom: colors.foreground }}
          size="15pt"
          weight="heavy"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
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
    gap: 16,
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
    maxWidth: 200,
  },
  arrowSeparator: {
    fontWeight: '200',
  },
});

function SwapToastContent({ toast }: { toast: RainbowToast }) {
  const title = getToastTitle(toast);
  const subtitle = getSwapToastNetworkLabel(toast);
  return (
    <ToastContentDisplay
      iconWidth={isWideSwapIcon(toast) ? SWAP_ICON_WIDTH : TOAST_ICON_SIZE}
      type={toast.transaction.status === TransactionStatus.failed ? 'error' : undefined}
      icon={<SwapToastIcon toast={toast} />}
      title={title}
      subtitle={subtitle}
    />
  );
}

export const getSwapToastNetworkLabel = ({ transaction }: RainbowToast) => {
  const outAsset = transaction.changes?.find(c => c?.direction === 'out')?.asset;
  const inAsset = transaction.changes?.find(c => c?.direction === 'in')?.asset;
  // using RNText because it can inherit the color/size from ToastContentDisplay
  return (
    <RNText>
      {outAsset?.symbol} <RNText style={styles.arrowSeparator}>􀄫</RNText> {inAsset?.symbol}
    </RNText>
  );
};

function SendToastContent({ toast }: { toast: RainbowToast }) {
  const { transaction } = toast;
  const title = getToastTitle(toast);
  const subtitle =
    toast.transaction.asset?.type === AssetType.nft ? transaction.asset?.name : `${transaction.amount} ${transaction.asset?.symbol}`;

  return (
    <ToastContentDisplay
      key={toast.transaction.status}
      icon={<SendToastIcon toast={toast} />}
      title={title}
      subtitle={subtitle}
      type={toast.transaction.status === TransactionStatus.failed ? 'error' : undefined}
    />
  );
}

function BaseToastContent({ toast }: { toast: RainbowToast }) {
  const { transaction } = toast;
  const launchToken = useTransactionLaunchToken(transaction);
  const icon = <BaseToastIcon toast={toast} />;
  const title = getToastTitle(toast);
  const subtitle = launchToken?.name || transaction.contract?.name || transaction.description;

  return (
    <ToastContentDisplay
      icon={icon}
      title={title}
      subtitle={subtitle}
      type={transaction.status === TransactionStatus.failed ? 'error' : undefined}
    />
  );
}

export const getToastTitle = (toast: RainbowToast): string => {
  // @ts-expect-error - some of these are dot.notation and some are strings
  return i18n.t(i18n.l.transactions.type[toast.transaction.title]);
};
