import React from 'react';
import { Box, Divider, Stack, Text } from '@rainbow-me/design-system';
import { useTheme } from '@rainbow-me/theme';

interface MenuProps {
  children: React.ReactNode;
  header?: string;
  description?: string;
}

const Menu = ({ children, description, header }: MenuProps) => {
  const { isDarkMode } = useTheme();
  return (
    <Stack space="12px">
      {!!header && (
        <Box paddingHorizontal={{ custom: 16 }}>
          <Text color="secondary60" size="16px" weight="regular">
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
      {!!description && (
        <Box paddingHorizontal={{ custom: 16 }} paddingTop="5px">
          <Text color="secondary60" size="14px" weight="regular">
            {description}
          </Text>
        </Box>
      )}
    </Stack>
  );
};

export default Menu;
