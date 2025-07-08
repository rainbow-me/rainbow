import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '@/styles';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';

const sfSymbols = {
  check: '􀆅',
};

const ICON_SIZE = 28;

export function SFSymbolIcon({ name }: { name: keyof typeof sfSymbols }) {
  const colors = useToastColors();

  return (
    <View
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: colors.green,
        shadowColor: colors.green,
        shadowRadius: 12,
        shadowOpacity: 1,
        shadowOffset: { height: 4, width: 0 },
      }}
    >
      {/* background at 90% */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.green,
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
          {sfSymbols[name]}
        </Text>
      </View>
    </View>
  );
}
