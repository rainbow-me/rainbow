import React from 'react';
import { AccentColorProvider, Box, Text } from '@/design-system';

interface IconOrbProps {
  color: string;
  shadowColor?: 'accent' | 'shadow';
  icon: string;
}

export const IconOrb = ({ color, icon, shadowColor }: IconOrbProps) => (
  <AccentColorProvider color={color}>
    {shadowColor ? (
      <Box
        width={{ custom: 36 }}
        height={{ custom: 36 }}
        borderRadius={18}
        background="accent"
        alignItems="center"
        justifyContent="center"
        shadow={shadowColor === 'accent' ? '18px accent' : '18px'}
      >
        <Text
          containsEmoji
          size="17pt"
          weight="bold"
          align="center"
          color="label"
        >
          {icon}
        </Text>
      </Box>
    ) : (
      <Box
        width={{ custom: 36 }}
        height={{ custom: 36 }}
        borderRadius={18}
        background="accent"
        alignItems="center"
        justifyContent="center"
      >
        <Text
          containsEmoji
          size="17pt"
          weight="bold"
          align="center"
          color="label"
        >
          {icon}
        </Text>
      </Box>
    )}
  </AccentColorProvider>
);
