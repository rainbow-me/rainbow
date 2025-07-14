import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '@/styles';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';

const sfSymbols = {
  check: '􀆅',
  exclamationMark: '􀅎',
};

const ICON_SIZE = 28;

export function SFSymbolIcon({ name }: { name: keyof typeof sfSymbols }) {
  const colors = useToastColors();
  const bg = name === 'check' ? colors.green : colors.red;

  return (
    <View
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
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
