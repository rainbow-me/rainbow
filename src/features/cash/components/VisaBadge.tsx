import React from 'react';
import { StyleSheet } from 'react-native';

import { Box, Text, type TextProps } from '@/design-system';

const SIZES = {
  small: { height: 20, textSize: 'icon 8px', width: 28 },
  large: { height: 26, textSize: 'icon 10px', width: 36 },
} satisfies Record<string, { height: number; textSize: TextProps['size']; width: number }>;

export function VisaBadge({ size = 'small' }: { size?: keyof typeof SIZES }) {
  const { height, textSize, width } = SIZES[size];

  return (
    <Box
      alignItems="center"
      borderRadius={6}
      height={{ custom: height }}
      justifyContent="center"
      style={styles.badge}
      width={{ custom: width }}
    >
      <Text align="center" color="white" size={textSize} weight="heavy">
        {'VISA'}
      </Text>
    </Box>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#1B33C3',
  },
});
