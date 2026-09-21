import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ImgixImage from '@/components/images/ImgixImage';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { type Competition, type Sport } from '@/features/sports/core/generated/sports';
import { sportsIcons } from '@/features/sports/ui/sportsIcons';
import { getSolidColorEquivalent } from '@/worklets/colors';

export function SportsImage({
  imageUrl,
  name,
  size,
  width = size,
  borderRadius = size === 24 ? 3 : 8,
}: {
  imageUrl?: string;
  name: string;
  size: number;
  width?: number;
  borderRadius?: number;
}) {
  return imageUrl ? (
    <RemoteImage key={imageUrl} imageUrl={imageUrl} name={name} width={width} height={size} borderRadius={borderRadius} />
  ) : (
    <ImageFallback name={name} size={Math.min(width, size)} />
  );
}

export function SportsBadge({ scope, size }: { scope: Sport | Competition; size: 28 | 40 | 44 }) {
  const { isDarkMode } = useColorMode();
  const fallback = useForegroundColor('fillTertiary');
  const icon = (size === 44 ? sportsIcons[`${scope.id}-header`] : undefined) ?? sportsIcons[scope.id];
  const color = icon?.color ?? scope.color;
  const imageSize = size * (icon?.scale ?? 20 / 28);
  const backgroundColor = color
    ? getSolidColorEquivalent({ background: color, foreground: '#000000', opacity: isDarkMode ? (icon?.darken ?? 0.3) : 0.1 })
    : fallback;
  const borderRadius = size === 28 ? 10 : size === 40 ? 12 : 14;
  const corners = { borderRadius, borderCurve: 'continuous' as const };

  return (
    <View style={isDarkMode && color ? [styles.glow, corners, { shadowColor: color }] : undefined}>
      <View
        style={[
          styles.image,
          styles.shadow,
          corners,
          { width: size, height: size, backgroundColor },
          size === 44 && !isDarkMode && styles.headerShadow,
        ]}
      >
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, corners]}>
          <LinearGradient colors={BADGE_HIGHLIGHT} style={styles.highlight} />
        </View>
        {icon ? (
          <ImgixImage
            enableFasterImage
            source={icon.source}
            resizeMode="contain"
            fasterImageConfig={IMAGE_CONFIG}
            style={{
              width: imageSize,
              height: imageSize,
              transform: [{ translateX: icon.offset?.[0] ?? 0 }, { translateY: icon.offset?.[1] ?? 0 }],
            }}
          />
        ) : (
          <SportsImage imageUrl={scope.imageUrl} name={scope.name} size={imageSize} borderRadius={0} />
        )}
        <Border
          borderRadius={borderRadius}
          borderWidth={2}
          borderColor={{ custom: isDarkMode ? 'rgba(255,255,255,0.1)' : size === 44 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)' }}
          enableInLightMode
        />
      </View>
    </View>
  );
}

function RemoteImage({
  imageUrl,
  name,
  width,
  height,
  borderRadius,
}: {
  imageUrl: string;
  name: string;
  width: number;
  height: number;
  borderRadius: number;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(width / height);
  if (aspectRatio === null) return <ImageFallback name={name} size={Math.min(width, height)} />;

  const fittedWidth = Math.min(width, height * aspectRatio);
  const fittedHeight = fittedWidth / aspectRatio;
  return (
    <View style={[styles.clip, { width: fittedWidth, height: fittedHeight, borderRadius }]}>
      <ImgixImage
        enableFasterImage
        source={{ uri: imageUrl }}
        resizeMode="contain"
        fasterImageConfig={IMAGE_CONFIG}
        onLoad={({ nativeEvent: { width, height } }) => setAspectRatio(width / height)}
        onError={() => setAspectRatio(null)}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function ImageFallback({ name, size }: { name: string; size: number }) {
  const backgroundColor = useForegroundColor('fillTertiary');
  return (
    <View style={[styles.image, styles.fallback, { width: size, height: size, backgroundColor }]}>
      <Text color="labelSecondary" size="13pt" weight="heavy">
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const BADGE_HIGHLIGHT = ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)'] as const;
const IMAGE_CONFIG = { transitionDuration: 0 };
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
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerShadow: { shadowRadius: 3 },
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
});
