import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Source } from 'react-native-fast-image';
import eyeSlash from '@/assets/sf-eye.slash.png';
import { Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { borders } from '@/styles';
import { ThemeContextProps, useTheme } from '@/theme';
import { FallbackIcon, initials } from '@/utils';
import ShadowStack from '@/react-native-shadow-stack';
import * as i18n from '@/languages';

type Props = {
  name: string;
  image?: string;
  style?: any;
};

const shadowsFactory = (colors: ThemeContextProps['colors']) => [[0, 3, android ? 5 : 9, colors.shadow, 0.1]];

const sx = StyleSheet.create({
  trophy: {
    width: 30,
  },
});

const circleStyle = borders.buildCircleAsObject(30);

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

  if (name === lang.t('button.hidden')) {
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

  const source = {
    uri: image,
  };

  const symbol = initials(name);

  return (
    // @ts-expect-error - typescript types
    <ShadowStack {...circleStyle} backgroundColor={colors.white} shadows={shadows} style={style}>
      {image ? <ImgixImage size={30} source={source} style={circleStyle} /> : <FallbackIcon {...circleStyle} symbol={symbol} />}
    </ShadowStack>
  );
}
