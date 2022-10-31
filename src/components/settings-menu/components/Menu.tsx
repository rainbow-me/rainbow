import React from 'react';
import { Box, Cover, Separator, Stack, Text } from '@/design-system';

interface MenuProps {
  children: React.ReactNode;
  header?: string;
  description?: string;
  loading?: boolean;
}

const Menu = ({ children, description, header, loading }: MenuProps) => {
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
        shadow="21px light (Deprecated)"
        width="full"
      >
        <Stack separator={<Separator color="divider60 (Deprecated)" />}>
          {children}
        </Stack>
        {!!loading && (
          <Cover>
            <Box
              height="full"
              width="full"
              alignItems="center"
              justifyContent="center"
              background="fillSecondary"
              borderRadius={18}
            >
              <Text color="purple" size="12px / 14px (Deprecated)">
                Loading...
              </Text>
            </Box>
          </Cover>
        )}
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
