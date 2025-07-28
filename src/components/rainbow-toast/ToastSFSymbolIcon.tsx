import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Text } from '@/design-system';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const sfSymbols = {
  check: '􀆅',
  exclamationMark: '􀅎',
};

export function ToastSFSymbolIcon({
  name,
  borderRadius = 100,
  size = TOAST_ICON_SIZE,
}: {
  name: keyof typeof sfSymbols;
  size?: number;
  borderRadius?: number;
}) {
  const colors = useToastColors();
  const bg = name === 'check' ? colors.green : colors.red;
  const content = sfSymbols[name];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        borderWidth: 2,
        borderColor: bg,
        shadowColor: bg,
        shadowRadius: 8,
        shadowOpacity: 0.4,
        shadowOffset: { height: 3, width: 0 },
      }}
    >
      <View
        style={[
          {
            flex: 1,
            backgroundColor: bg,
            // this gets us the right inner rounding based on the borderWidth above
            // we use a semi-rounded borderRadius for extral contracts which needs it
            borderRadius: borderRadius - 4,
            overflow: 'hidden',
            opacity: 0.85,
            alignItems: 'center',
            justifyContent: 'center',
            // for mint / semi-rounded transactions it refuses to touch the outer without this
            transform: [{ scale: 1.02 }],
          },
        ]}
      >
        <Text
          size="12pt"
          color={{ custom: colors.white }}
          weight="bold"
          // this does help center it visually
          style={{ transform: [{ translateX: StyleSheet.hairlineWidth }] }}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}
