import { Icon } from '@/components/icons';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { IS_IOS } from '@/env';
import { fonts } from '@/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const sfSymbols = {
  check: IS_IOS ? '􀆅' : <Icon style={{ marginLeft: 6, marginTop: 6 }} width={18} height={18} color="white" name="checkmark" />,
  exclamationMark: IS_IOS ? '􀅎' : <Icon size={12} color="white" name="warning" />,
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
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: bg,
            borderRadius: borderRadius - 5,
            overflow: 'hidden',
            opacity: 0.9,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {typeof content === 'string' ? (
          <Text
            allowFontScaling={false}
            style={{ fontSize: 12, fontFamily: fonts.family.SFProRounded, color: colors.white, fontWeight: '800' }}
          >
            {content}
          </Text>
        ) : (
          content
        )}
      </View>
    </View>
  );
}
