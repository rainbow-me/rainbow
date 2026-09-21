import { StyleSheet, View } from 'react-native';

import ImgixImage from '@/components/images/ImgixImage';
import { Text, useForegroundColor } from '@/design-system';

export function SportsImage({ imageUrl, name, size }: { imageUrl?: string; name: string; size: number }) {
  const fill = useForegroundColor('fillTertiary');
  return imageUrl ? (
    <ImgixImage source={{ uri: imageUrl }} resizeMode="contain" style={{ width: size, height: size }} />
  ) : (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 3, backgroundColor: fill }]}>
      <Text color="labelSecondary" size="13pt" weight="heavy">
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ fallback: { alignItems: 'center', justifyContent: 'center' } });
