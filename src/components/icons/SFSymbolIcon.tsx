import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { fonts } from '@/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const sfSymbols = {
  check: '􀆅',
  exclamationMark: '􀅎',
};

export function SFSymbolIcon({ name, size = TOAST_ICON_SIZE }: { name: keyof typeof sfSymbols; size?: number }) {
  const colors = useToastColors();
  const bg = name === 'check' ? colors.green : colors.red;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 100,
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
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: bg,
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
          style={{ fontSize: 12, fontFamily: fonts.family.SFProRounded, color: colors.white, fontWeight: '800' }}
        >
          {sfSymbols[name]}
        </Text>
      </View>
    </View>
  );
}
