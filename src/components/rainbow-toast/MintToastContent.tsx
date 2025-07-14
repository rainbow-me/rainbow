import { RainbowImage } from '@/components/RainbowImage';
import { ShimmerAnimation } from '@/components/animations';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import type { RainbowToastMint } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { TransactionStatus } from '@/entities';
import React from 'react';
import { View } from 'react-native';

export function MintToastContent({ toast }: { toast: RainbowToastMint }) {
  const colors = useToastColors();

  const icon = (() => {
    if (toast.image) {
      return <RainbowImage source={{ url: toast.image }} style={{ width: TOAST_ICON_SIZE, height: TOAST_ICON_SIZE }} />;
    }
    return <ShimmerAnimation color={colors.foreground} />;
  })();

  const title = toast.status === TransactionStatus.minting ? 'Minting' : 'Minted';
  const subtitle = toast.name;

  return (
    <ToastContent
      icon={
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 10,
            overflow: 'hidden',
            width: TOAST_ICON_SIZE,
            height: TOAST_ICON_SIZE,
          }}
        >
          {icon}
        </View>
      }
      title={title}
      subtitle={subtitle}
    />
  );
}
