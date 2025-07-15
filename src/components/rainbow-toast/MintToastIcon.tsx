import { RainbowImage } from '@/components/RainbowImage';
import { ShimmerAnimation } from '@/components/animations';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import type { RainbowToastMint } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import React from 'react';
import { View } from 'react-native';

export function MintToastIcon({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToastMint; size?: number }) {
  const colors = useToastColors();

  const content = (() => {
    if (toast.image) {
      return <RainbowImage source={{ url: toast.image }} style={{ width: size, height: size }} />;
    }
    return <ShimmerAnimation color={colors.foreground} />;
  })();

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
      {content}
    </View>
  );
}
