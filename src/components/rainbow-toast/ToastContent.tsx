import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { TruncatedText } from '@/components/text';
import React from 'react';
import { View } from 'react-native';

interface ToastContentProps {
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}

export function ToastContent({ icon, title, subtitle }: ToastContentProps) {
  const colors = useToastColors();

  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      {icon}
      <View style={{ gap: 4 }}>
        <TruncatedText color={colors.foreground} size="smedium" weight="bold">
          {title}
        </TruncatedText>
        <TruncatedText color={colors.foreground} opacity={0.5} size={12} weight="bold">
          {subtitle}
        </TruncatedText>
      </View>
    </View>
  );
}
