import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { type FastImageProps } from 'react-native-fast-image';

import ImgixImage from '@/components/images/ImgixImage';
import { Text, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { type Competition, type Sport } from '@/features/sports/core/generated/sports';
import { sportsIcons } from '@/features/sports/ui/sportsIcons';
import { SportsSurface } from '@/features/sports/ui/SportsSurface';
import { getSolidColorEquivalent } from '@/worklets/colors';

export function SportsImage({ imageUrl, name, size, width = size }: { imageUrl?: string; name: string; size: number; width?: number }) {
  return (
    <Artwork
      key={imageUrl ?? name}
      source={imageUrl ? { uri: imageUrl } : undefined}
      name={name}
      width={width}
      height={size}
      borderRadius={size === 24 ? 3 : 8}
    />
  );
}

export function SportsBadge({ scope, size }: { scope: Sport | Competition; size: 28 | 40 | 44 }) {
  const { isDarkMode } = useColorMode();
  const fallback = useForegroundColor('fillTertiary');
  const icon = (size === 44 ? sportsIcons[`${scope.id}-header`] : undefined) ?? sportsIcons[scope.id];
  const color = icon?.color ?? scope.color;
  const imageSize = size * (icon?.scale ?? 20 / 28);
  const background = color
    ? getSolidColorEquivalent({ background: color, foreground: '#000000', opacity: isDarkMode ? (icon?.darken ?? 0.3) : 0.1 })
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
      <Artwork
        key={icon ? scope.id : (scope.imageUrl ?? scope.id)}
        source={icon?.source ?? (scope.imageUrl ? { uri: scope.imageUrl } : undefined)}
        name={scope.name}
        width={imageSize}
        height={imageSize}
        offset={icon?.offset}
      />
    </SportsSurface>
  );
}

function Artwork({
  source,
  name,
  width,
  height,
  offset,
  borderRadius = 0,
}: {
  source?: FastImageProps['source'];
  name: string;
  width: number;
  height: number;
  offset?: readonly [number, number];
  borderRadius?: number;
}) {
  const [image, setImage] = useState<'loading' | 'failed' | { width: number; height: number }>(() =>
    typeof source === 'number' ? Image.resolveAssetSource(source) : 'loading'
  );
  const backgroundColor = useForegroundColor('fillTertiary');
  const placeholderSize = Math.min(width, height);
  if (!source || image === 'failed')
    return (
      <View style={[styles.image, styles.fallback, { width: placeholderSize, height: placeholderSize, backgroundColor }]}>
        <Text color="labelSecondary" size="13pt" weight="heavy">
          {name.slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  const loading = image === 'loading';
  const scale = loading ? 1 : Math.min(width / image.width, height / image.height);
  const fittedWidth = loading ? width : image.width * scale;
  const fittedHeight = loading ? height : image.height * scale;
  return (
    <View
      style={[
        styles.image,
        borderRadius ? styles.clip : undefined,
        {
          width: fittedWidth,
          height: fittedHeight,
          borderRadius,
          transform: offset ? [{ translateX: offset[0] }, { translateY: offset[1] }] : undefined,
        },
      ]}
    >
      {loading && <View style={[styles.placeholder, { width: placeholderSize, height: placeholderSize, backgroundColor }]} />}
      <ImgixImage
        enableFasterImage
        source={source}
        resizeMode="contain"
        fasterImageConfig={IMAGE_CONFIG}
        onLoad={({ nativeEvent: { width, height } }) => setImage({ width, height })}
        onError={() => setImage('failed')}
        style={{
          width: fittedWidth,
          height: fittedHeight,
          opacity: loading ? 0 : 1,
        }}
      />
    </View>
  );
}

const HEADER_SHADOWS = [{ color: 'rgba(0,0,0,0.06)', blur: 3, dx: 0, dy: 4 }];
const BADGE_SHADOWS = [{ color: 'rgba(0,0,0,0.06)', blur: 6, dx: 0, dy: 4 }];
const IMAGE_CONFIG = { transitionDuration: 0 };
const styles = StyleSheet.create({
  image: { alignItems: 'center', justifyContent: 'center' },
  clip: { overflow: 'hidden', borderCurve: 'continuous' },
  fallback: { borderRadius: 8, borderCurve: 'continuous', overflow: 'hidden' },
  placeholder: { position: 'absolute', borderRadius: 8, borderCurve: 'continuous' },
});
