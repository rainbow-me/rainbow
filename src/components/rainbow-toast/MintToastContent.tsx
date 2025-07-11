import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RainbowToastMint } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { fonts } from '@/styles';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';

export function MintToastContent({ toast }: { toast: RainbowToastMint }) {
  const colors = useToastColors();

  const icon = (
    <View
      style={{
        width: TOAST_ICON_SIZE,
        height: TOAST_ICON_SIZE,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: colors.purple,
        shadowColor: colors.purple,
        shadowRadius: 12,
        shadowOpacity: 1,
        shadowOffset: { height: 4, width: 0 },
      }}
    >
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.purple,
            borderRadius: 100,
            overflow: 'hidden',
            opacity: 0.9,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text
          allowFontScaling={false}
          style={{ fontSize: 12, fontFamily: fonts.family.SFProRounded, color: colors.foreground, fontWeight: '800' }}
        >
          ✨
        </Text>
      </View>
    </View>
  );

  const title = toast.status === 'minting' ? 'Minting...' : 'Minted';
  const subtitle = toast.name;

  return <ToastContent icon={icon} title={title} subtitle={subtitle} />;
}
