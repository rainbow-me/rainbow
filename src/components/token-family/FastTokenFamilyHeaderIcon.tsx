import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';
import { borders } from '@rainbow-me/styles';
import { ThemeContextProps } from '@rainbow-me/theme';
import { FallbackIcon, initials } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = (colors: ThemeContextProps['colors']) => [
  [0, 3, android ? 5 : 9, colors.shadow, 0.1],
];

const cx = StyleSheet.create({
  trophy: {
    marginRight: 4,
  },
});

export default React.memo(function FastTokenFamilyHeaderIcon({
  familyImage,
  familyName,
  isCoinRow,
  style,
  theme,
}: {
  familyName: string;
  theme: ThemeContextProps;
  isCoinRow?: boolean;
  familyImage?: string;
  style?: any;
}) {
  const { colors } = theme;
  const circleStyle = useMemo(
    () => borders.buildCircleAsObject(isCoinRow ? 40 : 32),
    [isCoinRow]
  );

  const shadows = useMemo(() => shadowsFactory(colors), [colors]);

  return familyName === 'Showcase' ? (
    <View style={cx.trophy}>
      <Text align="center" containsEmoji size="16px">
        🏆
      </Text>
    </View>
  ) : (
    // @ts-expect-error ShadowStack is not migrated to TS.
    <ShadowStack
      {...circleStyle}
      backgroundColor={colors.white}
      shadows={shadows}
      style={style}
    >
      {familyImage ? (
        <ImgixImage
          size={isCoinRow ? 40 : 32}
          source={{ uri: familyImage }}
          style={circleStyle}
        />
      ) : (
        <FallbackIcon {...circleStyle} symbol={initials(familyName)} />
      )}
    </ShadowStack>
  );
});
