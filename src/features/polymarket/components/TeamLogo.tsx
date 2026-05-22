import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { type ResponseByTheme } from '@/__swaps__/utils/swaps';
import { ImgixImage } from '@/components/images';
import { globalColors, Text, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';

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
  const contrastTreatment = getLogoContrastTreatment({ color: team.color, isDarkMode });
  const imageSize = contrastTreatment ? Math.max(size - 6, 1) : size;

  if (hasValidLogo) {
    return (
      <View
        style={[
          styles.imageFrame,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: contrastTreatment?.backgroundColor,
            borderColor: contrastTreatment?.borderColor,
            borderWidth: contrastTreatment ? 1 : 0,
          },
        ]}
      >
        <ImgixImage
          enableFasterImage
          onError={() => {
            if (team.logo && team.logo.length > 0) {
              setDidErrorForUrl(team.logo);
            }
          }}
          onLoad={() => setDidErrorForUrl(undefined)}
          resizeMode="contain"
          size={imageSize}
          source={{ uri: team.logo }}
          style={{ width: imageSize, height: imageSize, borderRadius: Math.max(borderRadius - 1, 0) }}
        />
      </View>
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

function getLogoContrastTreatment({
  color,
  isDarkMode,
}: {
  color?: ResponseByTheme<string>;
  isDarkMode: boolean;
}): { backgroundColor: string; borderColor: string } | null {
  const activeColor = isDarkMode ? color?.dark : color?.light;
  const luminance = getRelativeLuminance(activeColor);

  if (luminance === null) return null;

  if (isDarkMode && luminance < 0.18) {
    return {
      backgroundColor: opacity(globalColors.white100, 0.88),
      borderColor: opacity(globalColors.white100, 0.16),
    };
  }

  if (!isDarkMode && luminance > 0.82) {
    return {
      backgroundColor: opacity(globalColors.grey100, 0.72),
      borderColor: opacity(globalColors.grey100, 0.12),
    };
  }

  return null;
}

function getRelativeLuminance(color: string | undefined): number | null {
  const rgb = parseRgbColor(color);
  if (!rgb) return null;

  const [red, green, blue] = rgb.map(channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function parseRgbColor(color: string | undefined): [number, number, number] | null {
  if (!color) return null;

  const normalizedColor = color.trim();
  const hexMatch = normalizedColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1].length === 3 ? hexMatch[1].replace(/(.)/g, '$1$1') : hexMatch[1];
    return [0, 2, 4].map(start => parseInt(hex.slice(start, start + 2), 16)) as [number, number, number];
  }

  const rgbMatch = normalizedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }

  return null;
}

const styles = StyleSheet.create({
  imageFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
