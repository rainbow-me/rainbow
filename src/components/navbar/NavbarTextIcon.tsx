import React from 'react';
import { Box, Text } from '@/design-system';
import { useTheme } from '@/theme';

type NavbarIconProps = {
  icon: string;
  color: string;
};

export function NavbarTextIcon({ icon, color }: NavbarIconProps) {

  const { colors} = useTheme()
  return (
    <Box  borderRadius={99} paddingHorizontal="8px" padding="12px"  style={{backgroundColor: colors.alpha(color ?? colors.appleBlue, 0.3)}}>
    <Text
      align="center"
      color={{custom: color ?? colors.appleBlue}}
      size='17pt'
      weight="semibold"
    >
      {icon}
    </Text>
    </Box>
  );
}
