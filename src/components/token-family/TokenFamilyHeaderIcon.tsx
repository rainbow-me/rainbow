import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';
import { borders } from '@rainbow-me/styles';
import { ThemeContextProps } from '@rainbow-me/theme';
import { FallbackIcon, initials } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

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
    marginRight: 4,
  },
});

export default React.memo(function TokenFamilyHeaderIcon({
  familyImage,
  familyName,
  style,
  theme,
}: Props) {
  const { colors } = theme;
  const circleStyle = useMemo(() => borders.buildCircleAsObject(40), []);

  const shadows = useMemo(() => shadowsFactory(colors), [colors]);

  if (familyName === 'Showcase') {
    return (
      <View style={sx.trophy}>
        <Text align="center" containsEmoji size="16px">
          🏆
        </Text>
      </View>
    );
  }

  return (
    // @ts-expect-error ShadowStack is not migrated to TS.
    <ShadowStack
      {...circleStyle}
      backgroundColor={colors.white}
      shadows={shadows}
      style={style}
    >
      {familyImage ? (
        <ImgixImage
          size={40}
          source={{ cache: ImgixImage.cacheControl.web, uri: familyImage }}
          style={circleStyle}
        />
      ) : (
        // @ts-expect-error FallbackIcon is not migrated to TS.
        <FallbackIcon {...circleStyle} symbol={initials(familyName)} />
      )}
    </ShadowStack>
  );
});
