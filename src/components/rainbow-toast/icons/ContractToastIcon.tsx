import { RainbowImage } from '@/components/RainbowImage';
import { ShimmerAnimation } from '@/components/animations';
import { ToastSFSymbolIcon } from '@/components/rainbow-toast/ToastSFSymbolIcon';
import { doneTransactionStatuses, TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
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
  const borderRadius = toast.currentType === 'claim' ? 100 : 10;

  if (toast.status === TransactionStatus.failed) {
    return <ToastSFSymbolIcon borderRadius={BORDER_RADIUS} name="exclamationMark" />;
  }

  if (toast.status in doneTransactionStatuses) {
    return <ToastSFSymbolIcon borderRadius={BORDER_RADIUS} name="check" />;
  }

  return (
    <View
      style={{
        borderRadius,
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
