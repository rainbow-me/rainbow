import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { TruncatedText } from '@/components/text';
import React from 'react';
import { View } from 'react-native';

interface ToastContentProps {
  title: string;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  iconWidth?: number;
  type?: 'error';
}

export function ToastContent({ icon, title, subtitle, type, iconWidth = TOAST_ICON_SIZE }: ToastContentProps) {
  const colors = useToastColors();

  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View
        style={{
          width: iconWidth,
          height: TOAST_ICON_SIZE,
          flexShrink: 0,
        }}
      >
        {icon}
      </View>

      <View style={{ gap: 4, minWidth: 0, alignItems: 'center' }}>
        <TruncatedText color={colors.foreground} size="smedium" weight="bold">
          {title}
        </TruncatedText>
        <TruncatedText color={type === 'error' ? colors.red : colors.foreground} opacity={0.5} size={12} weight="bold">
          {subtitle}
        </TruncatedText>
      </View>
    </View>
  );
}
