import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Stack } from '@rainbow-me/design-system';

interface MenuContainerProps {
  children: React.ReactNode;
}
const MenuContainer = ({ children }: MenuContainerProps) => {
  return (
    <ScrollView scrollEventThrottle={32}>
      <Box
        paddingBottom={{ custom: 34.5 }}
        paddingHorizontal="19px"
        paddingTop="12px"
      >
        <Stack space="36px">{children}</Stack>
      </Box>
    </ScrollView>
  );
};

export default MenuContainer;
