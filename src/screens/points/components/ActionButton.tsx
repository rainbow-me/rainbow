import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Text, globalColors, useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';
import c from 'chroma-js';
import { StyleSheet } from 'react-native';

export const ActionButton = ({
  color,
  label,
  onPress,
  outline,
  small = false,
}: {
  color?: string;
  label: string;
  onPress?: () => void;
  outline?: boolean;
  small?: boolean;
}) => {
  const { isDarkMode } = useTheme();

  const fallbackColor = useForegroundColor('blue');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTeriary = useForegroundColor('separatorTertiary');

  const borderColor = isDarkMode ? separatorSecondary : separatorTeriary;

  const textColor = useMemo(() => {
    if (!color) return globalColors.white100;
    const contrastWithWhite = c.contrast(color, globalColors.white100);

    if (contrastWithWhite < 2.125) {
      return globalColors.grey100;
    } else {
      return globalColors.white100;
    }
  }, [color]);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.88} style={styles.actionButtonWrapper} transformOrigin="top">
      <Box
        paddingHorizontal={small ? '20px' : '24px'}
        style={[
          styles.actionButton,
          outline && styles.actionButtonOutline,
          {
            backgroundColor: outline ? 'transparent' : color || fallbackColor,
            borderColor: outline ? borderColor : undefined,
            height: small ? 44 : 48,
            shadowColor: outline ? 'transparent' : color || fallbackColor,
            shadowOpacity: isDarkMode ? 0.2 : 0.4,
          },
        ]}
      >
        <Text align="center" color={{ custom: outline ? color || fallbackColor : textColor }} size={small ? '17pt' : '20pt'} weight="heavy">
          {label}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignContent: 'center',
    borderRadius: 24,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 13 },
    shadowRadius: 26,
  },
  actionButtonOutline: {
    borderWidth: 2,
  },
  actionButtonWrapper: {
    alignSelf: 'center',
  },
});
