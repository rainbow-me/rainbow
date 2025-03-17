import * as i18n from '@/languages';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Source } from 'react-native-fast-image';
import eyeSlash from '@/assets/sf-eye.slash.png';
import { Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { borders } from '@/styles';
import { ThemeContextProps, useTheme } from '@/theme';
import { FallbackIcon, initials } from '@/utils';
import ShadowStack from '@/react-native-shadow-stack';
import { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type Props = {
  name: string;
  image?: string | 'hidden';
  style?: StyleProp<ViewStyle>;
};

const shadowsFactory = (colors: ThemeContextProps['colors']) => [[0, 3, android ? 5 : 9, colors.shadow, 0.1]];

const sx = StyleSheet.create({
  trophy: {
    width: 30,
  },
});

const circleStyle = borders.buildCircleAsObject(30) as {
  height: number;
  width: number;
  borderRadius: number;
};

export function CollectionHeaderIcon({ name, image, style }: Props) {
  const { colors } = useTheme();
  const shadows = useMemo(() => shadowsFactory(colors), [colors]);

  if (name === i18n.t(i18n.l.account.tab_showcase)) {
    return (
      <View style={sx.trophy}>
        <Text align="center" containsEmoji color="label" size="17pt">
          🏆
        </Text>
      </View>
    );
  }

  if (name === 'Selling') {
    return (
      <View style={sx.trophy}>
        <Text align="center" containsEmoji color="label" size="17pt">
          💸
        </Text>
      </View>
    );
  }

  if (name === i18n.t(i18n.l.button.hidden) || image === 'hidden') {
    return (
      <View
        style={[
          sx.trophy,
          {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 3,
          },
        ]}
      >
        <ImgixImage source={eyeSlash as Source} style={{ height: 17, width: 25 }} tintColor={colors.blueGreyDark60} size={30} />
      </View>
    );
  }

  const source = image && image !== 'hidden' ? { uri: image } : undefined;
  const symbol = initials(name);

  return (
    <ShadowStack {...circleStyle} backgroundColor={colors.white} shadows={shadows} style={style}>
      {source ? <ImgixImage size={30} source={source} style={circleStyle} /> : <FallbackIcon {...circleStyle} symbol={symbol} />}
    </ShadowStack>
  );
}
