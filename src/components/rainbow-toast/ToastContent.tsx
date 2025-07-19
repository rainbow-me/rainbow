import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Text } from '@/design-system';
import React from 'react';
import { View } from 'react-native';

interface ToastContentProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  iconWidth?: number;
  type?: 'error';
}

export function ToastContent({ icon, title, subtitle, type, iconWidth = TOAST_ICON_SIZE }: ToastContentProps) {
  const colors = useToastColors();

  return (
    <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center', minWidth: 130 }}>
      <View
        style={{
          width: iconWidth,
          // the ciruclar icons look further from the left edge than the text
          // looks from the right edge, so adjusting it visually a bit here
          marginLeft: -2,
          height: TOAST_ICON_SIZE,
          flexShrink: 0,
        }}
      >
        {icon}
      </View>

      <View style={{ gap: 4, minWidth: 0 }}>
        <Text color={{ custom: colors.foreground }} size="15pt" weight="bold" numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <Text
          color={{ custom: type === 'error' ? colors.red : colors.foreground }}
          size="13pt"
          weight="bold"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ opacity: 0.5 }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
