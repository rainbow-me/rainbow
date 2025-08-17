import { RainbowImage } from '@/components/RainbowImage';
import { ShimmerAnimation } from '@/components/animations';
import { ToastSFSymbolIcon } from '@/components/rainbow-toast/ToastSFSymbolIcon';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import type { RainbowToast } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { TransactionStatus } from '@/entities';
import React, { memo } from 'react';
import { View } from 'react-native';

const BORDER_RADIUS = 10;

export const BaseToastIcon = memo(function BaseToastIcon({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToast; size?: number }) {
  const { transaction } = toast;
  const colors = useToastColors();
  const borderRadius = toast.transaction.type === 'claim' ? 100 : 10;
  const image = // mint or other
    transaction.contract?.iconUrl ||
    // nft/token
    transaction.asset?.icon_url ||
    // sale
    transaction.changes?.[0]?.asset?.images?.lowResUrl ||
    '';

  if (toast.transaction.status === TransactionStatus.failed) {
    return <ToastSFSymbolIcon borderRadius={BORDER_RADIUS} name="exclamationMark" />;
  }

  if (toast.transaction.status === TransactionStatus.confirmed) {
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
      {image ? (
        <RainbowImage source={{ url: image }} style={{ width: size, height: size }} />
      ) : (
        <ShimmerAnimation color={colors.foreground} />
      )}
    </View>
  );
});
