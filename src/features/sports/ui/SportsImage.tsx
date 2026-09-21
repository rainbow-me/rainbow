import { StyleSheet, View } from 'react-native';

import ImgixImage from '@/components/images/ImgixImage';
import { Text, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { SportsSurface } from '@/features/sports/ui/SportsSurface';
import { getSolidColorEquivalent } from '@/worklets/colors';

export function SportsImage({
  imageUrl,
  name,
  size,
  width = size,
  color,
  decoration,
}: {
  imageUrl?: string;
  name: string;
  size: number;
  width?: number;
  color?: string;
  decoration?: 'badge';
}) {
  const { isDarkMode } = useColorMode();
  const fallback = useForegroundColor('fillTertiary');
  const badge = decoration === 'badge';
  const imageSize = badge ? (size === 28 ? 20 : size === 40 ? 28 : 32) : size;
  const image = imageUrl ? (
    <ImgixImage source={{ uri: imageUrl }} resizeMode="contain" style={{ width: badge ? imageSize : width, height: imageSize }} />
  ) : (
    <Text color="labelSecondary" size="13pt" weight="heavy">
      {name.slice(0, 2).toUpperCase()}
    </Text>
  );
  if (!badge) return <View style={[styles.image, { width, height: size }]}>{image}</View>;

  const background = color
    ? getSolidColorEquivalent({ background: color, foreground: '#000000', opacity: isDarkMode ? 0.3 : 0.1 })
    : fallback;
  return (
    <SportsSurface
      borderRadius={size === 28 ? 10 : size === 40 ? 12 : 14}
      color={background}
      borderColor={isDarkMode ? 'rgba(255,255,255,0.1)' : size === 44 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)'}
      shadows={
        isDarkMode && color
          ? [...BADGE_SHADOWS, { color: opacity(color, 0.2), blur: 12, dx: 0, dy: 0 }]
          : size === 44 && !isDarkMode
            ? HEADER_SHADOWS
            : BADGE_SHADOWS
      }
      innerShadow={{ color: 'rgba(255,255,255,0.18)', blur: 2.5, dx: 0, dy: 1, blendMode: 'plus' }}
      style={[styles.image, { width: size, height: size }]}
    >
      {image}
    </SportsSurface>
  );
}

const HEADER_SHADOWS = [{ color: 'rgba(0,0,0,0.06)', blur: 3, dx: 0, dy: 4 }];
const BADGE_SHADOWS = [{ color: 'rgba(0,0,0,0.06)', blur: 6, dx: 0, dy: 4 }];
const styles = StyleSheet.create({ image: { alignItems: 'center', justifyContent: 'center' } });
