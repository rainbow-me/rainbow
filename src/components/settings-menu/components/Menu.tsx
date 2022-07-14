import React from 'react';
import { Box, Divider, Stack } from '@rainbow-me/design-system';
import { useTheme } from '@rainbow-me/theme';

interface MenuProps {
  children: React.ReactNode;
}

export default function Menu({ children }: MenuProps) {
  const { isDarkMode } = useTheme();
  return (
    <Box
      background={isDarkMode ? 'accent' : 'body'}
      borderRadius={18}
      width="full"
    >
      <Stack separator={<Divider color="divider60" />}>{children}</Stack>
    </Box>
  );
}
