import React from 'react';
import { Box, Stack } from '@rainbow-me/design-system';
import { ScrollView } from 'react-native';

interface MenuContainerProps {
  children: React.ReactNode;
}
const MenuContainer = ({ children }: MenuContainerProps) => {
  return (
    <ScrollView scrollEventThrottle={32}>
      <Box
        paddingHorizontal="19px"
        paddingTop="12px"
        paddingBottom={{ custom: 34.5 }}
      >
        <Stack space="36px">{children}</Stack>
      </Box>
    </ScrollView>
  );
};

export default MenuContainer;
