import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Source } from 'react-native-fast-image';
import eyeSlash from '../../assets/sf-eye.slash.png';
import { Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { borders } from '@/styles';
import { ThemeContextProps } from '@/theme';
import { FallbackIcon, initials } from '@/utils';
import ShadowStack from '@/react-native-shadow-stack';
import * as i18n from '@/languages';

type Props = {
  familyName: string;
  theme: ThemeContextProps;
  familyImage?: string;
  style?: any;
};

const shadowsFactory = (colors: ThemeContextProps['colors']) => [
  [0, 3, android ? 5 : 9, colors.shadow, 0.1],
];

const sx = StyleSheet.create({
  trophy: {
    width: 30,
  },
});

const circleStyle = borders.buildCircleAsObject(30);

export default React.memo(function TokenFamilyHeaderIcon({
  familyImage,
  familyName,
  style,
  theme,
}: Props) {
  const { colors } = theme;

  const shadows = useMemo(() => shadowsFactory(colors), [colors]);

  if (familyName === i18n.t(i18n.l.account.tab_showcase)) {
    return (
      <View style={sx.trophy}>
        <Text
          align="center"
          containsEmoji
          color="primary (Deprecated)"
          size="16px / 22px (Deprecated)"
        >
          🏆
        </Text>
      </View>
    );
  }

  if (familyName === 'Selling') {
    return (
      <View style={sx.trophy}>
        <Text
          align="center"
          containsEmoji
          color="primary (Deprecated)"
          size="16px / 22px (Deprecated)"
        >
          💸
        </Text>
      </View>
    );
  }

  if (familyName === lang.t('button.hidden')) {
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
        <ImgixImage
          source={eyeSlash as Source}
          style={{ height: 17, width: 25 }}
          tintColor={colors.blueGreyDark60}
          size={30}
        />
      </View>
    );
  }

  const source = {
    uri: familyImage,
  };

  const symbol = initials(familyName);

  return (
    // @ts-expect-error ShadowStack is not migrated to TS.
    <ShadowStack
      {...circleStyle}
      backgroundColor={colors.white}
      shadows={shadows}
      style={style}
    >
      {familyImage ? (
        <ImgixImage size={30} source={source} style={circleStyle} />
      ) : (
        // @ts-expect-error FallbackIcon is not migrated to TS.
        <FallbackIcon {...circleStyle} symbol={symbol} />
      )}
    </ShadowStack>
  );
});
