import { RainbowImage } from '@/components/RainbowImage';
import { ShimmerAnimation } from '@/components/animations';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import type { RainbowToastMint } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import React from 'react';
import { View } from 'react-native';

export function MintToastIcon({ toast }: { toast: RainbowToastMint }) {
  const colors = useToastColors();

  const content = (() => {
    if (toast.image) {
      return <RainbowImage source={{ url: toast.image }} style={{ width: TOAST_ICON_SIZE, height: TOAST_ICON_SIZE }} />;
    }
    return <ShimmerAnimation color={colors.foreground} />;
  })();

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: 10,
        overflow: 'hidden',
        width: TOAST_ICON_SIZE,
        height: TOAST_ICON_SIZE,
      }}
    >
      {content}
    </View>
  );
}
