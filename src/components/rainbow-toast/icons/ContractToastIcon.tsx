import { RainbowImage } from '@/components/RainbowImage';
import { ShimmerAnimation } from '@/components/animations';
import { ToastSFSymbolIcon } from '@/components/rainbow-toast/ToastSFSymbolIcon';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import type { RainbowToastContract } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { TransactionStatus } from '@/entities';
import React, { memo } from 'react';
import { View } from 'react-native';

const BORDER_RADIUS = 10;

export const ContractToastIcon = memo(function ContractToastIcon({
  toast,
  size = TOAST_ICON_SIZE,
}: {
  toast: RainbowToastContract;
  size?: number;
}) {
  const colors = useToastColors();

  if (
    toast.status === TransactionStatus.approved ||
    toast.status === TransactionStatus.bridged ||
    toast.status === TransactionStatus.cancelled ||
    toast.status === TransactionStatus.confirmed ||
    toast.status === TransactionStatus.deposited ||
    toast.status === TransactionStatus.dropped ||
    toast.status === TransactionStatus.launched ||
    toast.status === TransactionStatus.minted ||
    toast.status === TransactionStatus.purchased ||
    toast.status === TransactionStatus.received ||
    toast.status === TransactionStatus.sent ||
    toast.status === TransactionStatus.sold ||
    toast.status === TransactionStatus.swapped ||
    toast.status === TransactionStatus.withdrew
  ) {
    return <ToastSFSymbolIcon borderRadius={BORDER_RADIUS} name="check" />;
  }

  if (toast.status === TransactionStatus.failed) {
    return <ToastSFSymbolIcon borderRadius={BORDER_RADIUS} name="exclamationMark" />;
  }

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: 10,
        overflow: 'hidden',
        width: size,
        height: size,
      }}
    >
      {toast.image ? (
        <RainbowImage source={{ url: toast.image }} style={{ width: size, height: size }} />
      ) : (
        <ShimmerAnimation color={colors.foreground} />
      )}
    </View>
  );
});
