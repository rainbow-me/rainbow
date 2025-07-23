import { RainbowImage } from '@/components/RainbowImage';
import { ShimmerAnimation } from '@/components/animations';
import { ToastSFSymbolIcon } from '@/components/rainbow-toast/ToastSFSymbolIcon';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import type { RainbowToastContract } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { TransactionStatus } from '@/entities';
import React from 'react';
import { View } from 'react-native';

export function ContractToastIcon({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToastContract; size?: number }) {
  const colors = useToastColors();

  if (
    toast.status === TransactionStatus.minted ||
    toast.status === TransactionStatus.swapped ||
    toast.status === TransactionStatus.confirmed
  ) {
    return <ToastSFSymbolIcon borderRadius={10} name="check" />;
  }

  if (toast.status === TransactionStatus.failed) {
    return <ToastSFSymbolIcon borderRadius={10} name="exclamationMark" />;
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
}
