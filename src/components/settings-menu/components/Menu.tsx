import React from 'react';
import { Box, Divider, Stack, Text } from '@rainbow-me/design-system';
import { useTheme } from '@rainbow-me/theme';

interface MenuProps {
  children: React.ReactNode;
  header?: string;
}

export default function Menu({ children, header }: MenuProps) {
  const { isDarkMode } = useTheme();
  return (
    <Stack space="12px">
      {!!header && (
        <Box paddingLeft="15px">
          <Text color="secondary60" size="16px" weight="medium">
            {header}
          </Text>
        </Box>
      )}
      <Box
        background={isDarkMode ? 'accent' : 'body'}
        shadow="9px medium"
        borderRadius={18}
        width="full"
      >
        <Stack separator={<Divider color="divider60" />}>{children}</Stack>
      </Box>
    </Stack>
  );
}
