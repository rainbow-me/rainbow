import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ImgixImage } from '@/components/images';
import { Text } from '@/design-system/components/Text/Text';
import { useColorMode } from '@/design-system/color/ColorMode';
import { ResponseByTheme } from '@/__swaps__/utils/swaps';

type TeamLogoProps = {
  team: {
    logo?: string;
    name?: string;
    color?: ResponseByTheme<string>;
  };
  size: number;
  borderRadius: number;
};

export const TeamLogo = memo(function TeamLogo({ team, size, borderRadius }: TeamLogoProps) {
  const { isDarkMode } = useColorMode();
  const [didErrorForUrl, setDidErrorForUrl] = useState<string | undefined>(undefined);

  const hasValidLogo = team.logo && team.logo.length > 0 && didErrorForUrl !== team.logo;

  if (hasValidLogo) {
    return (
      <ImgixImage
        enableFasterImage
        onError={() => {
          if (team.logo && team.logo.length > 0) {
            setDidErrorForUrl(team.logo);
          }
        }}
        onLoad={() => setDidErrorForUrl(undefined)}
        size={size}
        source={{ uri: team.logo }}
        style={{ width: size, height: size, borderRadius }}
      />
    );
  }

  const initial = team.name?.[0]?.toUpperCase() ?? '?';
  const backgroundColor = team.color ? (isDarkMode ? team.color.dark : team.color.light) : '#808080';

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius, backgroundColor }]}>
      <Text align="center" color={'white'} size="13pt" weight="heavy">
        {initial}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
