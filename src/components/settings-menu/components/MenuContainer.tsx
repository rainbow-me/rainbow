import React from 'react';
import { Box, Stack } from '@rainbow-me/design-system';
import { ScrollView } from 'react-native';

interface MenuContainerProps {
  children: React.ReactNode;
}
const MenuContainer = ({ children }: MenuContainerProps) => {
  return (
    <Box height="full" paddingTop="12px" width="full">
      <ScrollView scrollEventThrottle={32}>
        <Box paddingHorizontal="19px">
          <Stack space="36px">{children}</Stack>
        </Box>
      </ScrollView>
    </Box>
  );
};

export default MenuContainer;
