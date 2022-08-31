import React from 'react';
import { Box, Divider, Stack, Text } from '@rainbow-me/design-system';

interface MenuProps {
  children: React.ReactNode;
  header?: string;
  description?: string;
}

const Menu = ({ children, description, header }: MenuProps) => {
  return (
    <>
      {!!header && (
        <Box paddingBottom="12px" paddingHorizontal={{ custom: 16 }}>
          <Text
            color="secondary60"
            size="16px / 22px (Deprecated)"
            weight="regular"
          >
            {header}
          </Text>
        </Box>
      )}
      <Box background="card" borderRadius={18} shadow="21px light" width="full">
        <Stack separator={<Divider color="divider60" />}>{children}</Stack>
      </Box>
      {!!description && (
        <Box paddingHorizontal={{ custom: 16 }} paddingTop={{ custom: 17 }}>
          <Text
            color="secondary60"
            size="14px / 19px (Deprecated)"
            weight="regular"
          >
            {description}
          </Text>
        </Box>
      )}
    </>
  );
};

export default Menu;
