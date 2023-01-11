import React from 'react';
import { Box, Separator, Stack, Text } from '@/design-system';

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
            color="secondary60 (Deprecated)"
            size="16px / 22px (Deprecated)"
            weight="regular"
          >
            {header}
          </Text>
        </Box>
      )}
      <Box
        background="card (Deprecated)"
        borderRadius={18}
        shadow="12px"
        width="full"
      >
        <Stack separator={<Separator color="divider60 (Deprecated)" />}>
          {children}
        </Stack>
      </Box>
      {!!description && (
        <Box paddingHorizontal={{ custom: 16 }} paddingTop={{ custom: 17 }}>
          <Text
            color="secondary60 (Deprecated)"
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
