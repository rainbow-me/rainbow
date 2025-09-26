import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { useColorMode } from '@/design-system';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const HeaderFade = memo(function HeaderFade({ color, topInset }: { color?: string; topInset?: number }) {
  const { isDarkMode } = useColorMode();
  const gradientColor = color ?? (isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT);
  return (
    <EasingGradient
      endColor={gradientColor}
      endOpacity={0}
      startColor={gradientColor}
      startOpacity={1}
      style={topInset ? [styles.easingGradient, { top: topInset }] : styles.easingGradient}
    />
  );
});

const styles = StyleSheet.create({
  easingGradient: {
    height: 32,
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
    width: DEVICE_WIDTH,
    zIndex: 1000,
  },
});
