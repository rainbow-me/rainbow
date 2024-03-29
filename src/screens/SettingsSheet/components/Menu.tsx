import React from 'react';
import { Box, Separator, Stack, Text } from '@/design-system';

interface MenuProps {
  children: React.ReactNode;
  header?: string;
  description?: string | React.ReactNode;
}

const Menu = ({ children, description, header }: MenuProps) => {
  return (
    <>
      {!!header && (
        <Box paddingBottom="12px" paddingHorizontal={{ custom: 16 }}>
          <Text color="labelSecondary" size="16px / 22px (Deprecated)" weight="bold">
            {header}
          </Text>
        </Box>
      )}
      <Box background="surfaceSecondaryElevated" borderRadius={18} shadow="12px" width="full">
        <Stack separator={<Separator color="separatorTertiary" />}>{children}</Stack>
      </Box>
      {!!description && (
        <Box paddingHorizontal={{ custom: 16 }} paddingTop={{ custom: 17 }}>
          {typeof description === 'string' ? (
            <Text color="labelSecondary" size="14px / 19px (Deprecated)" weight="regular">
              {description}
            </Text>
          ) : (
            description
          )}
        </Box>
      )}
    </>
  );
};

export default Menu;
