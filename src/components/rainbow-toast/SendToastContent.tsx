import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToastSend } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { fonts } from '@/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SendToastContent({ toast }: { toast: RainbowToastSend }) {
  const icon = <SendToastIcon toast={toast} />;
  const title = toast.status === 'sending' ? 'Sending...' : toast.status === 'sent' ? 'Sent' : 'Failed';
  const subtitle = `${toast.amount} ${toast.token}`;
  return <ToastContent icon={icon} title={title} subtitle={subtitle} />;
}

export const SendToastIcon = ({ toast }: { toast: RainbowToastSend }) => {
  const colors = useToastColors();

  return (
    <View
      style={{
        width: TOAST_ICON_SIZE,
        height: TOAST_ICON_SIZE,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: colors.clearBlue,
        shadowColor: colors.clearBlue,
        shadowRadius: 12,
        shadowOpacity: 1,
        shadowOffset: { height: 4, width: 0 },
      }}
    >
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.clearBlue,
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
          {toast.status === 'failed' ? '!' : '↗'}
        </Text>
      </View>
    </View>
  );
};
