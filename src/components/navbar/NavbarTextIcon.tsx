import React from 'react';
import { Box, Cover, Text } from '@/design-system';
import { useTheme } from '@/theme';

type NavbarIconProps = {
  backgroundOpacity?: number;
  icon: string;
  color: string;
};

export function NavbarTextIcon({ backgroundOpacity, icon, color }: NavbarIconProps) {
  const { colors, isDarkMode } = useTheme();
  const accentColor = color ?? colors.appleBlue;

  return (
    <Box
      borderRadius={18}
      height={{ custom: 36 }}
      style={{
        backgroundColor: colors.alpha(accentColor, backgroundOpacity ?? (isDarkMode ? 0.2 : 0.1)),
      }}
      width={{ custom: 36 }}
    >
      <Box
        height="full"
        style={{
          shadowColor: isDarkMode ? colors.shadowBlack : accentColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
        }}
        width="full"
      >
        <Cover alignHorizontal="center" alignVertical="center">
          <Text align="center" color={{ custom: accentColor }} size="icon 17px" weight="bold">
            {icon}
          </Text>
        </Cover>
      </Box>
    </Box>
  );
}
