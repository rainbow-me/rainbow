import { memo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ImgixImage from '@/components/images/ImgixImage';
import { foregroundColors, globalColors } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { type SportsScope } from '@/features/sports/core/catalog';
import { SPORTS_BACKGROUND_COLOR_DARK, SPORTS_BACKGROUND_COLOR_LIGHT } from '@/features/sports/ui/colors';
import { sportsIcons } from '@/features/sports/ui/sportsIcons';
import { SurfaceShadow } from '@/framework/ui/components/SurfaceShadow';
import { black, getSolidColorEquivalent, white } from '@/worklets/colors';

const BADGE_HIGHLIGHT = [white(0.18), white(0)] as const;

/**
 * Displays a Sports image, falling back to the first two characters of its name.
 */
export const SportsImage = memo(function SportsImage({
  isDarkMode,
  imageUrl,
  name,
  size,
  width = size,
  borderRadius = size === 24 ? 3 : 8,
}: {
  isDarkMode: boolean;
  imageUrl?: string;
  name: string;
  /** Sets the image height and default width. */
  size: number;
  width?: number;
  borderRadius?: number;
}) {
  return (
    <RemoteImage
      key={imageUrl}
      imageUrl={imageUrl}
      width={width}
      height={size}
      borderRadius={borderRadius}
      fallback={<ImageFallback isDarkMode={isDarkMode} name={name} size={Math.min(width, size)} />}
    />
  );
});

/**
 * Displays a sport or competition badge with bundled or catalog artwork.
 */
export function SportsBadge({ scope, size, isDarkMode }: { scope: SportsScope; size: 28 | 40 | 44; isDarkMode: boolean }) {
  const icon = sportsIcons[scope.id];
  const color = icon?.color ?? scope.color;
  const imageSize = size * (20 / 28);

  const backgroundColor = color
    ? getSolidColorEquivalent({ background: color, foreground: globalColors.grey100, opacity: isDarkMode ? (icon?.darken ?? 0.3) : 0.1 })
    : foregroundColors.fillTertiary[isDarkMode ? 'dark' : 'light'];

  const backdropColor = color ? backgroundColor : isDarkMode ? SPORTS_BACKGROUND_COLOR_DARK : SPORTS_BACKGROUND_COLOR_LIGHT;
  const borderRadius = size === 28 ? 10 : size === 40 ? 12 : 14;
  const corners = { borderRadius, borderCurve: 'continuous' as const };

  return (
    <View style={[styles.image, styles.shadow, corners, { width: size, height: size, backgroundColor }]}>
      {isDarkMode && color ? (
        <SurfaceShadow backdropColor={backdropColor} borderRadius={borderRadius} color={color} opacity={0.2} radius={12} />
      ) : null}
      <SurfaceShadow
        backdropColor={backdropColor}
        borderRadius={borderRadius}
        color={globalColors.grey100}
        opacity={0.06}
        radius={size === 44 && !isDarkMode ? 3 : 6}
        y={4}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, corners]}>
        <LinearGradient colors={BADGE_HIGHLIGHT} style={styles.highlight} />
      </View>

      {icon ? (
        <ImgixImage enableFasterImage source={icon.source} resizeMode="contain" size={size} style={{ width: size, height: size }} />
      ) : (
        <RemoteImage
          key={scope.imageUrl}
          imageUrl={scope.imageUrl}
          width={imageSize}
          height={imageSize}
          borderRadius={0}
          fallback={<ImageInitials name={scope.name} />}
        />
      )}

      <Border
        borderRadius={borderRadius}
        borderWidth={2}
        borderColor={{ custom: isDarkMode ? white(0.1) : black(size === 44 ? 0.12 : 0.06) }}
        enableInLightMode
      />
    </View>
  );
}

function RemoteImage({
  imageUrl,
  width,
  height,
  borderRadius,
  fallback,
}: {
  imageUrl?: string;
  width: number;
  height: number;
  borderRadius: number;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) return fallback;

  return (
    <ImgixImage
      enableFasterImage
      source={{ uri: imageUrl }}
      resizeMode="contain"
      size={Math.max(width, height)}
      onError={() => setFailed(true)}
      style={{ width, height, borderRadius }}
    />
  );
}

function ImageFallback({ name, size, isDarkMode }: { name: string; size: number; isDarkMode: boolean }) {
  const backgroundColor = foregroundColors.fillTertiary[isDarkMode ? 'dark' : 'light'];
  return (
    <View style={[styles.image, styles.fallback, { width: size, height: size, backgroundColor }]}>
      <ImageInitials name={name} />
    </View>
  );
}

function ImageInitials({ name }: { name: string }) {
  return (
    <Text color="labelSecondary" size="13pt" weight="heavy">
      {name.slice(0, 2).toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  image: { alignItems: 'center', justifyContent: 'center' },
  clip: { overflow: 'hidden', borderCurve: 'continuous' },
  fallback: {
    borderRadius: 8,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  shadow: { elevation: 3 },
});
