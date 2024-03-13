/* eslint-disable no-nested-ternary */
import React from 'react';
import { Bleed, Box, Text, useColorMode } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { TextWeight } from '@/design-system/components/Text/Text';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../constants';

export const BalanceBadge = ({ color, label, weight }: { color?: TextColor; label: string; weight?: TextWeight }) => {
  const { isDarkMode } = useColorMode();

  return (
    <Bleed vertical={{ custom: 5.5 }}>
      <Box
        alignItems="center"
        borderRadius={8.5}
        height={{ custom: 20 }}
        justifyContent="center"
        paddingHorizontal={{ custom: 5 }}
        style={{
          borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
          borderWidth: THICK_BORDER_WIDTH,
        }}
      >
        <Text
          align="center"
          color={color || 'labelQuaternary'}
          size="13pt"
          style={{
            opacity: label === 'No Balance' ? (isDarkMode ? 0.6 : 0.75) : undefined,
          }}
          weight={weight || 'bold'}
        >
          {label}
        </Text>
      </Box>
    </Bleed>
  );
};
